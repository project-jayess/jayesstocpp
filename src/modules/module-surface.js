export function findExportByName(exports, exportedName) {
  return exports.find((entry) => entry.exportedName === exportedName) ?? null;
}

export function hasExport(exports, exportedName) {
  return findExportByName(exports, exportedName) != null;
}
