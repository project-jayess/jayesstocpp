import fs from "node:fs";
import path from "node:path";
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

function fileIfExists(candidate) {
  if (candidate != null && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  return null;
}

function resolveExportTarget(packageDirectory, packageJson, subpath) {
  if (typeof packageJson.exports === "string" && subpath.length === 0) {
    return { resolved: path.resolve(packageDirectory, packageJson.exports), unsupported: false };
  }

  if (packageJson.exports != null && typeof packageJson.exports === "object") {
    const key = subpath.length === 0 ? "." : `./${subpath}`;
    const value = packageJson.exports[key];
    if (typeof value === "string") {
      return { resolved: path.resolve(packageDirectory, value), unsupported: false };
    }
    if (value != null && typeof value === "object") {
      const importTarget = value.import ?? value.default;
      if (typeof importTarget === "string") {
        return { resolved: path.resolve(packageDirectory, importTarget), unsupported: false };
      }
      return { resolved: null, unsupported: true, key };
    }

    if (value != null) {
      return { resolved: null, unsupported: true, key };
    }

    if (subpath.length === 0 && !Object.prototype.hasOwnProperty.call(packageJson.exports, ".")) {
      const rootImportTarget = packageJson.exports.import ?? packageJson.exports.default;
      if (typeof rootImportTarget === "string") {
        return { resolved: path.resolve(packageDirectory, rootImportTarget), unsupported: false };
      }
      const looksLikeConditionalRoot = ["import", "require", "default", "node", "browser"].some(
        (condition) => Object.prototype.hasOwnProperty.call(packageJson.exports, condition)
      );
      if (looksLikeConditionalRoot) {
        return { resolved: null, unsupported: true, key: "." };
      }
    }
  }

  return { resolved: null, unsupported: false };
}

export function resolvePackageImport(fromFilename, source) {
  return resolvePackageImportDetailed(fromFilename, source).resolved;
}

export function resolvePackageImportDetailed(fromFilename, source) {
  const { packageName, subpath } = splitPackageSource(source);
  const packageDirectory = findNodeModulesStart(path.dirname(fromFilename), packageName);

  if (packageDirectory == null) {
    return { resolved: null, reason: "package-not-found", packageName, subpath };
  }

  if (subpath.length > 0) {
    const resolved = fileIfExists(path.resolve(packageDirectory, subpath))
      ?? fileIfExists(path.resolve(packageDirectory, `${subpath}.js`))
      ?? fileIfExists(path.resolve(packageDirectory, subpath, "index.js"));
    if (resolved != null) {
      return { resolved, reason: null, packageName, subpath };
    }
    return { resolved: null, reason: "package-subpath-not-found", packageName, subpath };
  }

  const packageJsonPath = path.join(packageDirectory, "package.json");
  const packageJson = readPackageJson(packageJsonPath);

  const resolvedFromExports = packageJson == null ? { resolved: null, unsupported: false } : resolveExportTarget(packageDirectory, packageJson, subpath);
  if (resolvedFromExports.resolved != null) {
    if (fileIfExists(resolvedFromExports.resolved) != null) {
      return { resolved: resolvedFromExports.resolved, reason: null, packageName, subpath };
    }
    return {
      resolved: null,
      reason: "package-export-target-missing",
      packageName,
      subpath,
      attemptedPath: resolvedFromExports.resolved
    };
  }
  if (resolvedFromExports.unsupported) {
    return {
      resolved: null,
      reason: "package-export-unsupported",
      packageName,
      subpath,
      exportKey: resolvedFromExports.key
    };
  }

  const mainField = packageJson?.main ?? "index.js";
  const resolved = fileIfExists(path.resolve(packageDirectory, mainField))
    ?? fileIfExists(path.resolve(packageDirectory, "index.js"));
  if (resolved != null) {
    return { resolved, reason: null, packageName, subpath, mainField };
  }
  return {
    resolved: null,
    reason: "package-entry-not-found",
    packageName,
    subpath,
    mainField
  };
}
