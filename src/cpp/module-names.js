import path from "node:path";

export function toModuleStem(filename, projectRoot) {
  const relative = projectRoot == null ? filename : path.relative(projectRoot, filename);
  return relative
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/[/.:-]+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_");
}

export function toModuleNamespace(moduleStem) {
  return `jayess_module_${moduleStem}`;
}
