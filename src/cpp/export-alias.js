import { toCppIdentifier } from "./cpp-identifiers.js";

function resolveImportedSymbolName(localName) {
  return localName === "default" ? "__default_export__" : toCppIdentifier(localName);
}

export function renderLocalExportAlias(exportRecord) {
  return `inline auto& ${toCppIdentifier(exportRecord.exportedName)} = ${toCppIdentifier(exportRecord.localName)};`;
}

export function renderReExportAlias(exportRecord, dependency) {
  const target = resolveImportedSymbolName(exportRecord.localName);
  return `inline auto& ${toCppIdentifier(exportRecord.exportedName)} = ${dependency.namespace}::${target};`;
}

export function renderExportAllAlias(exportedName, dependency) {
  const target = resolveImportedSymbolName(exportedName);
  return `inline auto& ${toCppIdentifier(exportedName)} = ${dependency.namespace}::${target};`;
}
