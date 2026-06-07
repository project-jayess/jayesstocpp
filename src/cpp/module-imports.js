import { classifyImport } from "../modules/classify-import.js";

export function collectImportBindings(imports) {
  const importBindings = new Map();

  for (const entry of imports) {
    for (const specifier of entry.specifiers) {
      importBindings.set(specifier.local, {
        importedName: specifier.imported,
        importSource: entry.source,
        importKind: specifier.kind
      });
    }
  }

  return importBindings;
}

function importHasRetainedBinding(entry, retainedImportLocalNames) {
  if (retainedImportLocalNames == null || entry.specifiers.length === 0) {
    return true;
  }
  return entry.specifiers.some((specifier) => retainedImportLocalNames.has(specifier.local));
}

export function collectHeaderIncludes(imports, includeOverrides = new Map(), retainedImportLocalNames = null) {
  const headers = new Set();

  for (const entry of imports) {
    if (!importHasRetainedBinding(entry, retainedImportLocalNames)) {
      continue;
    }
    const classification = classifyImport(entry.source);
    if (classification.kind === "cpp-header") {
      headers.add(`#include <${classification.header}>`);
    }
    if (classification.kind === "native-header") {
      headers.add(`#include ${JSON.stringify(includeOverrides.get(entry.source) ?? entry.source)}`);
    }
  }

  return [...headers].sort();
}
