import { findExportByName } from "./module-surface.js";

export function classifyImportForm(specifiers = []) {
  if (specifiers.length === 0) {
    return "side-effect";
  }

  if (specifiers.every((specifier) => specifier.kind === "named")) {
    return "named-import-list";
  }

  if (specifiers.every((specifier) => specifier.kind === "re-export")) {
    return "named-re-export-list";
  }

  if (specifiers.some((specifier) => specifier.kind === "namespace")) {
    return "namespace-or-mixed";
  }

  if (specifiers.some((specifier) => specifier.kind === "default")) {
    return specifiers.length === 1 ? "default" : "default-or-mixed";
  }

  return "mixed";
}

export function wholeModuleReasonForImportForm(importForm) {
  switch (importForm) {
    case "named-import-list":
    case "named-re-export-list":
      return null;
    case "side-effect":
      return "side-effect-import";
    case "default":
      return "default-import";
    case "default-or-mixed":
      return "mixed-default-import";
    case "namespace-or-mixed":
      return "namespace-or-mixed-import";
    default:
      return "mixed-import";
  }
}

export function requestedNamedImportNames(specifiers = []) {
  const importForm = classifyImportForm(specifiers);
  if (importForm !== "named-import-list" && importForm !== "named-re-export-list") {
    return [];
  }
  return specifiers.map((specifier) => specifier.imported).sort();
}

export function importBindings(specifiers = []) {
  return specifiers.map((specifier) => ({
    imported: specifier.imported,
    local: specifier.local,
    kind: specifier.kind
  }));
}

function originForExportRecord({ exportedName, exportRecord, targetModule, moduleByFilename, exportSurfaces }) {
  if (exportRecord?.source != null) {
    return targetModule.dependencies.find((entry) => entry.source === exportRecord.source)?.resolved ?? targetModule.filename;
  }

  const directExport = targetModule.analysis.exports.find((entry) => entry.exportedName === exportedName);
  if (directExport != null) {
    return targetModule.filename;
  }

  for (const exportAll of targetModule.analysis.exports.filter((entry) => entry.kind === "export-all")) {
    const dependency = targetModule.dependencies.find((entry) => entry.source === exportAll.source);
    const nestedModule = moduleByFilename?.get(dependency?.resolved);
    if (nestedModule == null) {
      continue;
    }
    const nestedSurface = exportSurfaces?.get(nestedModule.filename);
    if (findExportByName(nestedSurface?.exports ?? nestedModule.analysis.exports, exportedName) != null) {
      return nestedModule.filename;
    }
  }

  return targetModule.filename;
}

export function resolveReachableExports({ dependency, targetModule, exportSurface, moduleByFilename, exportSurfaces }) {
  const requestedNames = requestedNamedImportNames(dependency.specifiers);
  if (targetModule == null || requestedNames.length === 0) {
    return [];
  }

  return requestedNames.map((exportedName) => {
    const exportRecord = findExportByName(exportSurface?.exports ?? targetModule.analysis.exports, exportedName);

    return {
      exportedName,
      localName: exportRecord?.localName ?? null,
      exportKind: exportRecord?.kind ?? null,
      source: exportRecord?.source ?? null,
      originFilename: originForExportRecord({ exportedName, exportRecord, targetModule, moduleByFilename, exportSurfaces })
    };
  });
}
