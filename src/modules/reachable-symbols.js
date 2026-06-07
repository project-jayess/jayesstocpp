import { collectDeclarationReferences } from "./declaration-references.js";
import { expandExportSurfaces } from "./export-surface.js";
import { moduleWholeReason } from "./reachability-fallbacks.js";
import {
  classifyImportForm,
  requestedNamedImportNames,
  wholeModuleReasonForImportForm
} from "./import-reachability.js";

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function concreteExportNames(exportSurface) {
  return (exportSurface?.exportNames ?? []).filter((name) => name !== "default").sort();
}

function createInitialSummary(moduleRecord, graph, exportSurface) {
  const exportNames = concreteExportNames(exportSurface);
  const isEntry = moduleRecord.filename === graph.entryFilename;
  const declarationReferences = collectDeclarationReferences(moduleRecord);
  const initialRetainedDeclarations = isEntry ? declarationReferences.map((entry) => entry.name).sort() : [];
  const initialRetainedExports = isEntry ? exportNames : [];
  return {
    sourceFilename: moduleRecord.filename,
    exportNames,
    declarationReferences,
    reachableExports: [],
    retainedExports: initialRetainedExports,
    prunedExports: isEntry ? [] : exportNames,
    retainedLocalDeclarations: initialRetainedDeclarations,
    retainedImportLocals: isEntry
      ? retainedImportLocals(moduleRecord, declarationReferences, initialRetainedDeclarations, initialRetainedExports)
      : [],
    wholeModuleReasons: isEntry ? ["entry-module"] : []
  };
}

function shouldPropagateDependency(moduleRecord, dependency, summary) {
  if (summary == null || summary.wholeModuleReasons.length > 0) {
    return true;
  }
  if (dependency.specifiers.length === 0) {
    return true;
  }
  const retainedImports = new Set(summary.retainedImportLocals);
  return dependency.specifiers.some((specifier) => retainedImports.has(specifier.local));
}

export function analyzeReachableSymbols(graph) {
  const exportSurfaces = expandExportSurfaces(graph);
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const summaries = new Map();

  for (const moduleRecord of graph.modules) {
    summaries.set(moduleRecord.filename, createInitialSummary(moduleRecord, graph, exportSurfaces.get(moduleRecord.filename)));
  }

  for (const moduleRecord of graph.modules) {
    const importerSummary = summaries.get(moduleRecord.filename);
    for (const dependency of moduleRecord.dependencies) {
      if (dependency.resolved == null || !summaries.has(dependency.resolved)) {
        continue;
      }
      if (!shouldPropagateDependency(moduleRecord, dependency, importerSummary)) {
        continue;
      }

      const summary = summaries.get(dependency.resolved);
      const importForm = classifyImportForm(dependency.specifiers);
      const targetModule = moduleByFilename.get(dependency.resolved);
      const wholeModuleReason = wholeModuleReasonForImportForm(importForm)
        ?? moduleWholeReason(targetModule, exportSurfaces.get(dependency.resolved), moduleByFilename);

      if (wholeModuleReason != null) {
        summary.wholeModuleReasons = sortedUnique([...summary.wholeModuleReasons, wholeModuleReason]);
        summary.retainedExports = summary.exportNames;
        summary.prunedExports = [];
        summary.retainedLocalDeclarations = summary.declarationReferences.map((entry) => entry.name).sort();
        summary.retainedImportLocals = retainedImportLocals(targetModule, summary.declarationReferences, summary.retainedLocalDeclarations, summary.retainedExports);
        continue;
      }

      const requestedNames = requestedNamedImportNames(dependency.specifiers);
      summary.reachableExports = sortedUnique([...summary.reachableExports, ...requestedNames]);
      if (summary.wholeModuleReasons.length === 0) {
        summary.retainedExports = sortedUnique([...summary.retainedExports, ...requestedNames]);
        summary.prunedExports = summary.exportNames.filter((name) => !summary.retainedExports.includes(name));
        summary.retainedLocalDeclarations = retainedLocalDeclarations(summary, exportSurfaces.get(dependency.resolved));
        summary.retainedImportLocals = retainedImportLocals(targetModule, summary.declarationReferences, summary.retainedLocalDeclarations, summary.retainedExports);
      }
    }
  }

  return summaries;
}

function retainedImportLocals(moduleRecord, declarationReferences, retainedDeclarations, retainedExports) {
  const retained = new Set(retainedDeclarations);
  const retainedExportNames = new Set(retainedExports);
  const declarationImportLocals =
    declarationReferences
      .filter((entry) => retained.has(entry.name))
      .flatMap((entry) => entry.importReferences);
  const reExportImportLocals = moduleRecord.dependencies
    .flatMap((dependency) => dependency.specifiers)
    .filter((specifier) => specifier.kind === "re-export" && retainedExportNames.has(specifier.local))
    .map((specifier) => specifier.local);
  return sortedUnique([...declarationImportLocals, ...reExportImportLocals]);
}

function retainedLocalDeclarations(summary, exportSurface) {
  const exportToLocal = new Map((exportSurface?.exports ?? []).map((entry) => [entry.exportedName, entry.localName]));
  const referencesByName = new Map(summary.declarationReferences.map((entry) => [entry.name, entry.localReferences]));
  const retained = new Set(summary.retainedExports.map((name) => exportToLocal.get(name) ?? name));
  const pending = [...retained];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const referenced of referencesByName.get(current) ?? []) {
      if (!retained.has(referenced)) {
        retained.add(referenced);
        pending.push(referenced);
      }
    }
  }

  return [...retained].sort();
}
