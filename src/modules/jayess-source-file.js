import path from "node:path";

const supportedSourceExtensions = new Set([".js", ".mjs"]);

export function isSupportedJayessSourceFile(filename) {
  return supportedSourceExtensions.has(path.extname(filename));
}

export function getSupportedJayessSourceExtensions() {
  return [...supportedSourceExtensions].sort();
}
