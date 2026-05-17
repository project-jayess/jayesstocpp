function resolveImportedSymbolName(localName) {
  return localName === "default" ? "__default_export__" : localName;
}

export function renderLocalExportAlias(exportRecord) {
  return `inline auto& ${exportRecord.exportedName} = ${exportRecord.localName};`;
}

export function renderReExportAlias(exportRecord, dependency) {
  const target = resolveImportedSymbolName(exportRecord.localName);
  return `inline auto& ${exportRecord.exportedName} = ${dependency.namespace}::${target};`;
}

export function renderExportAllAlias(exportedName, dependency) {
  const target = resolveImportedSymbolName(exportedName);
  return `inline auto& ${exportedName} = ${dependency.namespace}::${target};`;
}
