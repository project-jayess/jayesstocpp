import path from "node:path";
import { toModuleStem } from "../cpp/module-names.js";
import { builtinModuleRelativePath } from "../modules/builtin-root.js";

function normalizeRelativePath(filename) {
  return filename.replace(/\\/g, "/");
}

function relativeOutputPath(targetDirname, filename) {
  return normalizeRelativePath(path.relative(targetDirname, filename));
}

function planBuiltinModulePaths(filename, targetDirname) {
  const builtinRelative = builtinModuleRelativePath(filename);
  if (builtinRelative == null) {
    return null;
  }

  const stem = toModuleStem(path.join("stdlib", "jayess", builtinRelative), null);
  const outputDir = path.join(targetDirname, "generated-stdlib", "jayess", path.dirname(builtinRelative));
  const headerPath = path.join(outputDir, `${stem}.hpp`);
  const cppPath = path.join(outputDir, `${stem}.cpp`);
  return {
    moduleStem: stem,
    headerPath,
    cppPath,
    headerIncludePath: relativeOutputPath(targetDirname, headerPath),
    cppOutputPath: relativeOutputPath(targetDirname, cppPath),
    sourceKind: "repository-stdlib"
  };
}

export function planModulePaths(filename, projectRoot, targetDirname) {
  const builtinPaths = planBuiltinModulePaths(filename, targetDirname);
  if (builtinPaths != null) {
    return builtinPaths;
  }

  const stem = toModuleStem(filename, projectRoot);
  const headerPath = path.join(targetDirname, `${stem}.hpp`);
  const cppPath = path.join(targetDirname, `${stem}.cpp`);
  return {
    moduleStem: stem,
    headerPath,
    cppPath,
    headerIncludePath: relativeOutputPath(targetDirname, headerPath),
    cppOutputPath: relativeOutputPath(targetDirname, cppPath),
    sourceKind: "source-module"
  };
}

export function ensureInsideTarget(targetDirname, candidatePath) {
  const relative = path.relative(targetDirname, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
