import fs from "node:fs";
import path from "node:path";
import { getSupportedJayessSourceExtensions, isSupportedJayessSourceFile } from "./jayess-source-file.js";
import { readPackageJson } from "./read-package-json.js";

function splitPackageSource(source) {
  if (source.startsWith("@")) {
    const [scope, name, ...rest] = source.split("/");
    return {
      packageName: `${scope}/${name ?? ""}`,
      subpath: rest.join("/")
    };
  }

  const [name, ...rest] = source.split("/");
  return {
    packageName: name,
    subpath: rest.join("/")
  };
}

function findNodeModulesStart(startDirectory, packageName) {
  let current = startDirectory;

  while (true) {
    const candidate = path.join(current, "node_modules", packageName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function findPackageSelfReferenceStart(startDirectory, packageName) {
  let current = startDirectory;

  while (true) {
    const packageJson = readPackageJson(path.join(current, "package.json"));
    if (packageJson?.name === packageName) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function findPackageScope(startDirectory) {
  let current = startDirectory;

  while (true) {
    const packageJsonPath = path.join(current, "package.json");
    const packageJson = readPackageJson(packageJsonPath);
    if (packageJson != null) {
      return { packageDirectory: current, packageJson };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function fileIfExists(candidate) {
  if (candidate != null && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  return null;
}

function isInsidePackageRoot(packageDirectory, candidate) {
  const relative = path.relative(packageDirectory, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function selectConditionalExportTarget(value) {
  const conditionTrace = [];
  const rejectedConditions = [];
  const conditionDecisions = [];
  for (const condition of ["jayess", "import", "default"]) {
    conditionTrace.push(condition);
    if (typeof value[condition] === "string") {
      conditionDecisions.push({
        condition,
        present: true,
        selected: true,
        reason: "selected-string-target"
      });
      return { target: value[condition], condition, conditionTrace, rejectedConditions, conditionDecisions };
    }
    if (Object.prototype.hasOwnProperty.call(value, condition)) {
      rejectedConditions.push(condition);
      conditionDecisions.push({
        condition,
        present: true,
        selected: false,
        reason: `unsupported-target-type:${Array.isArray(value[condition]) ? "array" : typeof value[condition]}`
      });
    } else {
      conditionDecisions.push({
        condition,
        present: false,
        selected: false,
        reason: "missing"
      });
    }
  }
  return { target: null, condition: null, conditionTrace, rejectedConditions, conditionDecisions };
}

function matchExportPattern(exportsMap, key) {
  for (const [patternKey, value] of Object.entries(exportsMap)) {
    const starIndex = patternKey.indexOf("*");
    if (starIndex < 0) {
      continue;
    }
    const prefix = patternKey.slice(0, starIndex);
    const suffix = patternKey.slice(starIndex + 1);
    if (!key.startsWith(prefix) || !key.endsWith(suffix)) {
      continue;
    }
    return {
      key: patternKey,
      value,
      match: key.slice(prefix.length, key.length - suffix.length)
    };
  }
  return null;
}

function expandExportPatternTarget(target, match) {
  if (typeof target !== "string") {
    return null;
  }
  return target.replaceAll("*", match);
}

function targetSkipReason(packageDirectory, resolved) {
  if (!isInsidePackageRoot(packageDirectory, resolved)) {
    return "outside-package-root";
  }
  if (fileIfExists(resolved) == null) {
    return "missing";
  }
  if (!isSupportedJayessSourceFile(resolved)) {
    return "unsupported-file-type";
  }
  return null;
}

function arrayEntryKind(entry) {
  if (typeof entry === "string") {
    return "string";
  }
  if (entry != null && typeof entry === "object" && !Array.isArray(entry)) {
    return "conditions";
  }
  return Array.isArray(entry) ? "array" : typeof entry;
}

function resolvePackageTargetValue(packageDirectory, value, patternMatch = null, allowArray = true) {
  if (typeof value === "string") {
    const expanded = expandExportPatternTarget(value, patternMatch);
    if (expanded == null) {
      return { resolved: null, unsupported: true, unsupportedReason: "invalid-pattern-target" };
    }
    return { resolved: path.resolve(packageDirectory, expanded), unsupported: false };
  }
  if (Array.isArray(value)) {
    if (!allowArray) {
      return { resolved: null, unsupported: true, unsupportedReason: "nested-array-not-supported" };
    }
    return resolvePackageTargetArray(packageDirectory, value, patternMatch);
  }
  if (value != null && typeof value === "object") {
    const { target, condition, conditionTrace, rejectedConditions, conditionDecisions } = selectConditionalExportTarget(value);
    const expanded = expandExportPatternTarget(target, patternMatch);
    if (expanded != null) {
      return { resolved: path.resolve(packageDirectory, expanded), unsupported: false, condition, conditionTrace, rejectedConditions, conditionDecisions };
    }
    return { resolved: null, unsupported: true, conditionTrace, rejectedConditions, conditionDecisions, unsupportedReason: "unsupported-conditions" };
  }
  if (value != null) {
    return { resolved: null, unsupported: true, unsupportedReason: `invalid-target-value-type:${typeof value}` };
  }
  return { resolved: null, unsupported: false };
}

function resolvePackageTargetArray(packageDirectory, values, patternMatch) {
  const arrayTrace = [];
  for (const [index, entry] of values.entries()) {
    const result = resolvePackageTargetValue(packageDirectory, entry, patternMatch, false);
    const traceEntry = {
      index,
      kind: arrayEntryKind(entry),
      condition: result.condition ?? null,
      conditionTrace: result.conditionTrace ?? [],
      rejectedConditions: result.rejectedConditions ?? [],
      conditionDecisions: result.conditionDecisions ?? [],
      resolved: result.resolved ?? null,
      selected: false,
      reason: null
    };

    if (result.resolved == null || result.unsupported) {
      arrayTrace.push({ ...traceEntry, reason: "unsupported" });
      continue;
    }

    const skipReason = targetSkipReason(packageDirectory, result.resolved);
    if (skipReason != null) {
      arrayTrace.push({
        ...traceEntry,
        reason: skipReason,
        attemptedPath: result.resolved,
        attemptedExtension: path.extname(result.resolved)
      });
      continue;
    }

    arrayTrace.push({ ...traceEntry, selected: true, attemptedPath: result.resolved });
    return { ...result, arrayTrace, unsupported: false };
  }

  return { resolved: null, unsupported: true, arrayTrace, unsupportedReason: "array-no-supported-target" };
}

function resolveExportTarget(packageDirectory, packageJson, subpath) {
  if ((typeof packageJson.exports === "string" || Array.isArray(packageJson.exports)) && subpath.length === 0) {
    const result = resolvePackageTargetValue(packageDirectory, packageJson.exports);
    return { ...result, key: "." };
  }

  if (packageJson.exports != null && typeof packageJson.exports === "object") {
    const key = subpath.length === 0 ? "." : `./${subpath}`;
    const value = packageJson.exports[key];
    if (value != null) {
      const result = resolvePackageTargetValue(packageDirectory, value);
      return { ...result, key };
    }

    const pattern = matchExportPattern(packageJson.exports, key);
    if (pattern != null) {
      const result = resolvePackageTargetValue(packageDirectory, pattern.value, pattern.match);
      return { ...result, key: pattern.key, patternMatch: pattern.match };
    }

    if (subpath.length === 0 && !Object.prototype.hasOwnProperty.call(packageJson.exports, ".")) {
      const result = resolvePackageTargetValue(packageDirectory, packageJson.exports, null, false);
      const looksLikeConditionalRoot = ["jayess", "import", "require", "default", "node", "browser"].some(
        (condition) => Object.prototype.hasOwnProperty.call(packageJson.exports, condition)
      );
      if (result.resolved != null) {
        return { ...result, key: "." };
      }
      if (looksLikeConditionalRoot) {
        return { ...result, unsupported: true, key: "." };
      }
    }
  }

  return { resolved: null, unsupported: false };
}

function resolvePackageImportsTarget(packageDirectory, packageJson, source) {
  if (packageJson.imports == null || typeof packageJson.imports !== "object" || Array.isArray(packageJson.imports)) {
    return { resolved: null, unsupported: false };
  }

  const value = packageJson.imports[source];
  if (value != null) {
    const result = resolvePackageTargetValue(packageDirectory, value);
    return { ...result, key: source };
  }

  const pattern = matchExportPattern(packageJson.imports, source);
  if (pattern != null) {
    const result = resolvePackageTargetValue(packageDirectory, pattern.value, pattern.match);
    return { ...result, key: pattern.key, patternMatch: pattern.match };
  }

  return { resolved: null, unsupported: false };
}

export function resolvePackageImportsDetailed(fromFilename, source) {
  const startDirectory = path.dirname(fromFilename);
  const packageScope = findPackageScope(startDirectory);

  if (packageScope == null) {
    return { resolved: null, reason: "package-import-scope-not-found", packageName: null, subpath: source, requestedSubpath: source, allowedExtensions: getSupportedJayessSourceExtensions() };
  }

  const { packageDirectory, packageJson } = packageScope;
  const packageName = packageJson.name ?? null;
  const resolvedFromImports = resolvePackageImportsTarget(packageDirectory, packageJson, source);
  const base = {
    packageName,
    subpath: source,
    packageRoot: packageDirectory,
    packageResolutionMode: "package-import",
    packageField: "imports",
    importKey: resolvedFromImports.key ?? source,
    importPatternMatch: resolvedFromImports.patternMatch ?? null,
    importCondition: resolvedFromImports.condition ?? null,
    importConditionTrace: resolvedFromImports.conditionTrace ?? [],
    importRejectedConditions: resolvedFromImports.rejectedConditions ?? [],
    importConditionDecisions: resolvedFromImports.conditionDecisions ?? [],
    importArrayTrace: resolvedFromImports.arrayTrace ?? [],
    requestedSubpath: source,
    allowedExtensions: getSupportedJayessSourceExtensions()
  };

  if (resolvedFromImports.resolved != null) {
    if (!isInsidePackageRoot(packageDirectory, resolvedFromImports.resolved)) {
      return {
        ...base,
        resolved: null,
        reason: "package-target-outside-root",
        attemptedPath: resolvedFromImports.resolved
      };
    }
    if (fileIfExists(resolvedFromImports.resolved) != null) {
      return { ...base, resolved: resolvedFromImports.resolved, reason: null };
    }
    return {
      ...base,
      resolved: null,
      reason: "package-import-target-missing",
      attemptedPath: resolvedFromImports.resolved
    };
  }

  if (resolvedFromImports.unsupported) {
    return { ...base, resolved: null, reason: "package-import-unsupported", packageUnsupportedReason: resolvedFromImports.unsupportedReason ?? null };
  }

  return { ...base, resolved: null, reason: "package-import-not-found" };
}

export function resolvePackageImport(fromFilename, source) {
  return resolvePackageImportDetailed(fromFilename, source).resolved;
}

export function resolvePackageImportDetailed(fromFilename, source) {
  const { packageName, subpath } = splitPackageSource(source);
  const startDirectory = path.dirname(fromFilename);
  const selfPackageDirectory = findPackageSelfReferenceStart(startDirectory, packageName);
  const packageDirectory = selfPackageDirectory ?? findNodeModulesStart(startDirectory, packageName);
  const resolutionMode = selfPackageDirectory == null ? "node-modules" : "self-reference";

  if (packageDirectory == null) {
    return { resolved: null, reason: "package-not-found", packageName, subpath, requestedSubpath: subpath, packageRootAttempts: [path.join(startDirectory, "node_modules", packageName)], allowedExtensions: getSupportedJayessSourceExtensions() };
  }

  const packageJsonPath = path.join(packageDirectory, "package.json");
  const packageJson = readPackageJson(packageJsonPath);

  const resolvedFromExports = packageJson == null ? { resolved: null, unsupported: false } : resolveExportTarget(packageDirectory, packageJson, subpath);
  const packageBase = {
    packageName,
    subpath,
    requestedSubpath: subpath,
    packageRoot: packageDirectory,
    packageResolutionMode: resolutionMode,
    allowedExtensions: getSupportedJayessSourceExtensions()
  };
  if (resolvedFromExports.resolved != null) {
    if (!isInsidePackageRoot(packageDirectory, resolvedFromExports.resolved)) {
      return {
        resolved: null,
        reason: "package-target-outside-root",
        ...packageBase,
        packageField: "exports",
        exportKey: resolvedFromExports.key ?? ".",
        exportPatternMatch: resolvedFromExports.patternMatch ?? null,
        exportCondition: resolvedFromExports.condition ?? null,
        exportConditionTrace: resolvedFromExports.conditionTrace ?? [],
        exportRejectedConditions: resolvedFromExports.rejectedConditions ?? [],
        exportConditionDecisions: resolvedFromExports.conditionDecisions ?? [],
        exportArrayTrace: resolvedFromExports.arrayTrace ?? [],
        attemptedPath: resolvedFromExports.resolved
      };
    }
    if (fileIfExists(resolvedFromExports.resolved) != null) {
      return {
        resolved: resolvedFromExports.resolved,
        reason: null,
        ...packageBase,
        packageField: "exports",
        exportKey: resolvedFromExports.key ?? ".",
        exportPatternMatch: resolvedFromExports.patternMatch ?? null,
        exportCondition: resolvedFromExports.condition ?? null,
        exportConditionTrace: resolvedFromExports.conditionTrace ?? [],
        exportRejectedConditions: resolvedFromExports.rejectedConditions ?? [],
        exportConditionDecisions: resolvedFromExports.conditionDecisions ?? [],
        exportArrayTrace: resolvedFromExports.arrayTrace ?? []
      };
    }
    return {
      resolved: null,
      reason: "package-export-target-missing",
      ...packageBase,
      packageField: "exports",
      exportKey: resolvedFromExports.key ?? ".",
      exportPatternMatch: resolvedFromExports.patternMatch ?? null,
      exportCondition: resolvedFromExports.condition ?? null,
      exportConditionTrace: resolvedFromExports.conditionTrace ?? [],
      exportRejectedConditions: resolvedFromExports.rejectedConditions ?? [],
      exportConditionDecisions: resolvedFromExports.conditionDecisions ?? [],
      attemptedPath: resolvedFromExports.resolved
    };
  }
  if (resolvedFromExports.unsupported) {
    return {
      resolved: null,
      reason: "package-export-unsupported",
      ...packageBase,
      packageField: "exports",
      exportKey: resolvedFromExports.key,
      exportPatternMatch: resolvedFromExports.patternMatch ?? null,
      exportConditionTrace: resolvedFromExports.conditionTrace ?? [],
      exportRejectedConditions: resolvedFromExports.rejectedConditions ?? [],
      exportConditionDecisions: resolvedFromExports.conditionDecisions ?? [],
      exportArrayTrace: resolvedFromExports.arrayTrace ?? [],
      packageUnsupportedReason: resolvedFromExports.unsupportedReason ?? null
    };
  }

  if (subpath.length > 0) {
    const attempts = [
      path.resolve(packageDirectory, subpath),
      path.resolve(packageDirectory, `${subpath}.js`),
      path.resolve(packageDirectory, subpath, "index.js")
    ];
    const resolved = fileIfExists(attempts[0])
      ?? fileIfExists(attempts[1])
      ?? fileIfExists(attempts[2]);
    if (resolved != null) {
      if (!isInsidePackageRoot(packageDirectory, resolved)) {
        return { resolved: null, reason: "package-target-outside-root", ...packageBase, attemptedPath: resolved, packageResolutionTrace: attempts };
      }
      return { resolved, reason: null, ...packageBase, packageResolutionTrace: attempts };
    }
    return { resolved: null, reason: "package-subpath-not-found", ...packageBase, packageResolutionTrace: attempts };
  }

  const mainField = packageJson?.main ?? "index.js";
  const selectedField = packageJson?.main == null ? "index" : "main";
  const resolved = fileIfExists(path.resolve(packageDirectory, mainField))
    ?? fileIfExists(path.resolve(packageDirectory, "index.js"));
  if (resolved != null) {
    if (!isInsidePackageRoot(packageDirectory, resolved)) {
      return { resolved: null, reason: "package-target-outside-root", ...packageBase, packageField: selectedField, mainField, attemptedPath: resolved };
    }
    return { resolved, reason: null, ...packageBase, packageField: selectedField, mainField };
  }
  return {
    resolved: null,
    reason: "package-entry-not-found",
    ...packageBase,
    packageField: selectedField,
    mainField
  };
}
