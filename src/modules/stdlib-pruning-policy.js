import { builtinModuleRelativePath, isBuiltinModuleFilename } from "./builtin-root.js";

const declarationPrunableBuiltins = new Set([
  "canvas/core.js",
  "canvas/index.js",
  "canvas/polygon-helpers.js",
  "canvas/scalar-helpers.js",
  "canvas/shapes.js",
  "canvas/state.js",
  "canvas/xml-renderer.js",
  "canvas/xml-scene.js",
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
