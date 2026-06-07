import { builtinModuleRelativePath, isBuiltinModuleFilename } from "./builtin-root.js";

const declarationPrunableBuiltins = new Set([
  "console/index.js",
  "font/index.js",
  "fs/index.js"
]);

export function canPruneModuleDeclarations(moduleRecord) {
  if (!isBuiltinModuleFilename(moduleRecord.filename)) {
    return true;
  }
  return declarationPrunableBuiltins.has(builtinModuleRelativePath(moduleRecord.filename));
}
