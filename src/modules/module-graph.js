import fs from "node:fs";
import path from "node:path";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleFileDiagnostic } from "../diagnostics/module-diagnostic.js";
import { parse } from "../parser/parse.js";
import { createSourceText } from "../source/source-text.js";
import { analyzeModule } from "../semantic/analyze.js";
import { classifyImport } from "./classify-import.js";
import { getSupportedJayessSourceExtensions, isSupportedJayessSourceFile } from "./jayess-source-file.js";
import { readPackageJson } from "./read-package-json.js";
import { resolveBuiltinModule } from "./resolve-builtin-module.js";
import { resolvePackageImportDetailed, resolvePackageImportsDetailed } from "./resolve-package-import.js";
import { resolveRelativeImport } from "./resolve-relative-import.js";
import { validateModuleGraph } from "./validate-module-graph.js";

function throwMissingModule(filename) {
  throwDiagnostics([createModuleFileDiagnostic(filename, `Cannot resolve module '${filename}'`)]);
}

function throwCycle(filename) {
  throwDiagnostics([createModuleFileDiagnostic(filename, `Import cycle detected at '${filename}'`)]);
}

function throwUnsupportedPackageTarget(source, resolved, failure) {
  const supported = getSupportedJayessSourceExtensions().join(", ");
  const packageContext = failure?.packageRoot == null ? "" : ` from package root '${failure.packageRoot}'`;
  const packageDetail = failure?.packageName == null ? "" : ` package '${failure.packageName}'`;
  let resolutionDetail = "";
  if (failure?.packageField === "exports") {
    resolutionDetail = ` via package.json exports key '${failure.exportKey ?? "."}'`;
  } else if (failure?.packageField === "main" || failure?.packageField === "index") {
    resolutionDetail = ` via package.json ${failure.packageField} entry '${failure.mainField}'`;
  } else if (failure?.subpath?.length > 0) {
    resolutionDetail = ` via package subpath './${failure.subpath}'`;
  }
  throwDiagnostics([
    createModuleFileDiagnostic(
      resolved,
      `Package import '${source}' resolved${packageContext} through${packageDetail}${resolutionDetail} to unsupported file type '${path.extname(resolved)}' at '${resolved}'; this installed package is not a transpileable Jayess package. Only Jayess source files (${supported}) are transpileable package targets`,
      source
    )
  ]);
}

function describeUnsupportedPackageReason(failure, mappingKind) {
  const arrayLabel = mappingKind === "exports" ? "exports array" : "imports array";
  const arrayTrace = mappingKind === "exports" ? failure?.exportArrayTrace : failure?.importArrayTrace;

  if (failure?.packageUnsupportedReason === "array-no-supported-target") {
    const traceDetail = describeArrayTrace(arrayTrace);
    return `; the ${arrayLabel} contains no supported transpileable target${traceDetail}`;
  }
  if (failure?.packageUnsupportedReason === "unsupported-conditions") {
    const checked = failure.exportConditionTrace ?? failure.importConditionTrace ?? [];
    if (checked.length > 0) {
      return `; checked conditions ${checked.map((condition) => `'${condition}'`).join(", ")} but none resolved to a supported Jayess source target`;
    }
    return "; no supported Jayess export conditions resolved";
  }
  if (failure?.packageUnsupportedReason === "nested-array-not-supported") {
    return "; nested arrays are not supported in this mapping";
  }
  if (failure?.packageUnsupportedReason === "invalid-pattern-target") {
    return "; the selected target could not be expanded into a supported file path";
  }
  if (failure?.packageUnsupportedReason?.startsWith("invalid-target-value-type:")) {
    const targetType = failure.packageUnsupportedReason.split(":")[1];
    return `; the selected target value type '${targetType}' is not supported`;
  }

  return "";
}

function describeConditionDecisions(decisions) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    return "";
  }
  return ` checked ${decisions.map((decision) => `${decision.condition}:${decision.reason}`).join(", ")}`;
}

function describeArrayTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) {
    return "";
  }
  const entries = trace.map((entry) => {
    const conditionDetail = describeConditionDecisions(entry.conditionDecisions);
    const extensionDetail = entry.attemptedExtension != null && entry.attemptedExtension !== "" ? ` ${entry.attemptedExtension}` : "";
    return `entry ${entry.index} ${entry.kind} ${entry.reason ?? "selected"}${extensionDetail}${conditionDetail}`;
  });
  return ` (${entries.join("; ")})`;
}

function throwPackageResolutionFailure(source, failure) {
  if (failure?.reason === "package-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' was not found in node_modules`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-subpath-not-found") {
    const trace = failure.packageResolutionTrace?.length > 0
      ? `; checked ${failure.packageResolutionTrace.map((candidate) => `'${candidate}'`).join(", ")}`
      : "";
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package subpath './${failure.subpath}' was not found in '${failure.packageName}' at '${failure.packageRoot}'${trace}`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-export-target-missing") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package export target '${failure.attemptedPath}' from package root '${failure.packageRoot}' does not exist`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-export-unsupported") {
    const reasonDetail = describeUnsupportedPackageReason(failure, "exports");
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' at '${failure.packageRoot}' uses an unsupported package.json exports mapping for '${failure.exportKey}'${reasonDetail}. Jayess currently supports direct transpileable string targets, narrow jayess/import/default targets, and arrays of those targets`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-entry-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' is installed at package root '${failure.packageRoot}' but is not a transpileable Jayess package. It has no transpileable entry file from package.json ${failure.packageField} field (checked '${failure.mainField}')`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-target-outside-root") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' points outside its package root '${failure.packageRoot}' at '${failure.attemptedPath}'`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-import-scope-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': no package.json scope was found for private package import specifier`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-import-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' at '${failure.packageRoot}' has no package.json imports mapping for '${source}'`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-import-target-missing") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package imports target '${failure.attemptedPath}' from package root '${failure.packageRoot}' does not exist`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-import-unsupported") {
    const reasonDetail = describeUnsupportedPackageReason(failure, "imports");
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' at '${failure.packageRoot}' uses an unsupported package.json imports mapping for '${failure.importKey}'${reasonDetail}. Jayess currently supports direct transpileable string targets, narrow jayess/import/default targets, and arrays of those targets`,
        source
      )
    ]);
  }

  throwMissingModule(source);
}

function throwBuiltinResolutionFailure(source) {
  throwDiagnostics([
    createModuleFileDiagnostic(
      source,
      `Cannot resolve built-in Jayess module '${source}' from the repository stdlib layout`,
      source
    )
  ]);
}

function resolveImportTarget(fromFilename, source) {
  const classification = classifyImport(source);

  if (classification.kind === "jayess-module") {
    return { resolved: resolveRelativeImport(fromFilename, source), failure: null };
  }

  if (classification.kind === "builtin-module") {
    return { resolved: resolveBuiltinModule(source), failure: null };
  }

  if (classification.kind === "package") {
    const result = resolvePackageImportDetailed(fromFilename, source);
    return { resolved: result.resolved, failure: result };
  }

  if (classification.kind === "package-import") {
    const result = resolvePackageImportsDetailed(fromFilename, source);
    return { resolved: result.resolved, failure: result };
  }

  return { resolved: null, failure: null };
}

export function buildModuleGraph(entryFilename) {
  const visited = new Map();
  const root = path.resolve(entryFilename);
  const projectRoot = path.dirname(root);
  const projectPackageJson = readPackageJson(path.join(projectRoot, "package.json"));

  function visit(filename, stack = [], source = null) {
    if (stack.includes(filename)) {
      throwCycle(filename);
    }
    if (visited.has(filename)) {
      return;
    }
    if (!fs.existsSync(filename)) {
      throwMissingModule(filename);
    }

    const sourceText = createSourceText(fs.readFileSync(filename, "utf8"), filename);
    const ast = parse(sourceText);
    const analysis = analyzeModule(ast, sourceText);
    const moduleRecord = { filename, source, sourceText, ast, analysis, dependencies: [] };
    visited.set(filename, moduleRecord);

    for (const entry of analysis.imports) {
      const classification = classifyImport(entry.source);
      const { resolved, failure } = resolveImportTarget(filename, entry.source);

      if ((classification.kind === "jayess-module" || classification.kind === "builtin-module" || classification.kind === "package" || classification.kind === "package-import") && resolved == null) {
        if (classification.kind === "package" || classification.kind === "package-import") {
          throwPackageResolutionFailure(entry.source, failure);
        }
        if (classification.kind === "builtin-module") {
          throwBuiltinResolutionFailure(entry.source);
        }
        throwMissingModule(entry.source);
      }

      if ((classification.kind === "package" || classification.kind === "package-import") && resolved != null && !isSupportedJayessSourceFile(resolved)) {
        throwUnsupportedPackageTarget(entry.source, resolved, failure);
      }

      moduleRecord.dependencies.push({
        source: entry.source,
        kind: classification.kind,
        resolved,
        specifiers: entry.specifiers,
        packageName: classification.kind === "package" || classification.kind === "package-import" ? failure?.packageName : undefined,
        packageRoot: classification.kind === "package" || classification.kind === "package-import" ? failure?.packageRoot : undefined,
        packageResolutionMode: classification.kind === "package" || classification.kind === "package-import" ? failure?.packageResolutionMode : undefined,
        packageField: classification.kind === "package" || classification.kind === "package-import" ? failure?.packageField : undefined,
        packageExportKey: classification.kind === "package" ? failure?.exportKey : undefined,
        packageExportPatternMatch: classification.kind === "package" ? failure?.exportPatternMatch : undefined,
        packageExportCondition: classification.kind === "package" ? failure?.exportCondition : undefined,
        packageExportConditionTrace: classification.kind === "package" ? failure?.exportConditionTrace : undefined,
        packageExportRejectedConditions: classification.kind === "package" ? failure?.exportRejectedConditions : undefined,
        packageExportConditionDecisions: classification.kind === "package" ? failure?.exportConditionDecisions : undefined,
        packageExportArrayTrace: classification.kind === "package" ? failure?.exportArrayTrace : undefined,
        packageImportKey: classification.kind === "package-import" ? failure?.importKey : undefined,
        packageImportPatternMatch: classification.kind === "package-import" ? failure?.importPatternMatch : undefined,
        packageImportCondition: classification.kind === "package-import" ? failure?.importCondition : undefined,
        packageImportConditionTrace: classification.kind === "package-import" ? failure?.importConditionTrace : undefined,
        packageImportRejectedConditions: classification.kind === "package-import" ? failure?.importRejectedConditions : undefined,
        packageImportConditionDecisions: classification.kind === "package-import" ? failure?.importConditionDecisions : undefined,
        packageImportArrayTrace: classification.kind === "package-import" ? failure?.importArrayTrace : undefined,
        packageMainField: classification.kind === "package" ? failure?.mainField : undefined,
        packageResolutionTrace: classification.kind === "package" ? failure?.packageResolutionTrace : undefined,
        packageRequestedSubpath: classification.kind === "package" || classification.kind === "package-import" ? failure?.requestedSubpath : undefined,
        packageAllowedExtensions: classification.kind === "package" || classification.kind === "package-import" ? failure?.allowedExtensions : undefined
      });

      if (resolved != null) {
        visit(resolved, [...stack, filename], entry.source);
      }
    }
  }

  visit(root, []);
  const graph = {
    entryFilename: root,
    projectRoot,
    projectPackageJson,
    modules: [...visited.values()]
  };
  validateModuleGraph(graph);
  return graph;
}
