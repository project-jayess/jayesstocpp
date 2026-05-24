import path from "node:path";
import { fileURLToPath } from "node:url";

export const builtinRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../stdlib/jayess");

export function isBuiltinModuleFilename(filename) {
  if (filename == null) {
    return false;
  }
  const relative = path.relative(builtinRoot, path.resolve(filename));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function builtinModuleRelativePath(filename) {
  if (!isBuiltinModuleFilename(filename)) {
    return null;
  }
  return path.relative(builtinRoot, path.resolve(filename)).replace(/\\/g, "/");
}
