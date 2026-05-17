import path from "node:path";
import { toModuleStem } from "../cpp/module-names.js";

export function planModulePaths(filename, projectRoot, targetDirname) {
  const stem = toModuleStem(filename, projectRoot);
  return {
    moduleStem: stem,
    headerPath: path.join(targetDirname, `${stem}.hpp`),
    cppPath: path.join(targetDirname, `${stem}.cpp`)
  };
}

export function ensureInsideTarget(targetDirname, candidatePath) {
  const relative = path.relative(targetDirname, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
