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
    return path.resolve(packageDirectory, packageJson.exports);
  }

  if (packageJson.exports != null && typeof packageJson.exports === "object") {
    const key = subpath.length === 0 ? "." : `./${subpath}`;
    const value = packageJson.exports[key];
    if (typeof value === "string") {
      return path.resolve(packageDirectory, value);
    }
    if (value != null && typeof value === "object") {
      const importTarget = value.import ?? value.default;
      if (typeof importTarget === "string") {
        return path.resolve(packageDirectory, importTarget);
      }
    }
  }

  return null;
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

  const resolvedFromExports = packageJson == null ? null : resolveExportTarget(packageDirectory, packageJson, subpath);
  if (resolvedFromExports != null) {
    if (fileIfExists(resolvedFromExports) != null) {
      return { resolved: resolvedFromExports, reason: null, packageName, subpath };
    }
    return {
      resolved: null,
      reason: "package-export-target-missing",
      packageName,
      subpath,
      attemptedPath: resolvedFromExports
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
