import { isDeclarationPruningShape } from "../modules/declaration-pruning-shape.js";
import { collectDeclarationReferences } from "../modules/declaration-references.js";
import { canPruneModuleDeclarations } from "../modules/stdlib-pruning-policy.js";

export function retainedDeclarationNamesFor(moduleRecord, reachableSymbols, forcedRetainedDeclarations = null) {
  const summary = reachableSymbols.get(moduleRecord.filename);
  if (summary == null || summary.wholeModuleReasons.length > 0) {
    return null;
  }
  if (!canPruneModuleDeclarations(moduleRecord)) {
    return null;
  }
  if (!isDeclarationPruningShape(moduleRecord.ast)) {
    return null;
  }
  if (forcedRetainedDeclarations == null || forcedRetainedDeclarations.size === 0) {
    return summary.retainedLocalDeclarations;
  }
  return [...new Set([...summary.retainedLocalDeclarations, ...forcedRetainedDeclarations])].sort();
}

export function retainedImportLocalNamesFor(moduleRecord, reachableSymbols) {
  const summary = reachableSymbols.get(moduleRecord.filename);
  if (summary == null || summary.wholeModuleReasons.length > 0) {
    return null;
  }
  if (!canPruneModuleDeclarations(moduleRecord) || !isDeclarationPruningShape(moduleRecord.ast)) {
    return null;
  }
  return summary.retainedImportLocals;
}

export function shouldRetainModuleDependency(moduleRecord, importRecord, reachableSymbols) {
  const retainedImportLocals = retainedImportLocalNamesFor(moduleRecord, reachableSymbols);
  if (retainedImportLocals == null || importRecord.specifiers.length === 0) {
    return true;
  }
  const retained = new Set(retainedImportLocals);
  return importRecord.specifiers.some((specifier) => retained.has(specifier.local));
}

export function shouldWriteModule(moduleRecord, graph, reachableSymbols) {
  if (moduleRecord.filename === graph.entryFilename) {
    return true;
  }
  const summary = reachableSymbols.get(moduleRecord.filename);
  if (summary == null || summary.wholeModuleReasons.length > 0) {
    return true;
  }
  return summary.retainedLocalDeclarations.length > 0 || summary.retainedExports.length > 0;
}

export function createEmittedModuleSet(graph, reachableSymbols) {
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const emitted = new Set(
    graph.modules
      .filter((moduleRecord) => shouldWriteModule(moduleRecord, graph, reachableSymbols))
      .map((moduleRecord) => moduleRecord.filename)
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (const filename of [...emitted]) {
      const moduleRecord = moduleByFilename.get(filename);
      if (moduleRecord == null) {
        continue;
      }
      for (const dependency of moduleRecord.dependencies) {
        if (
          dependency.resolved != null
          && moduleByFilename.has(dependency.resolved)
          && shouldRetainModuleDependency(moduleRecord, dependency, reachableSymbols)
          && !emitted.has(dependency.resolved)
        ) {
          emitted.add(dependency.resolved);
          changed = true;
        }
      }
    }
  }

  return emitted;
}

export function shouldCopyNativeArtifact(moduleRecord, importRecord, reachableSymbols, forceAllImports = false, retainedImportLocalNamesOverride = undefined) {
  if (forceAllImports) {
    return true;
  }
  const retainedImportLocals = retainedImportLocalNamesOverride === undefined
    ? retainedImportLocalNamesFor(moduleRecord, reachableSymbols)
    : retainedImportLocalNamesOverride;
  if (retainedImportLocals == null || importRecord.specifiers.length === 0) {
    return true;
  }
  const retained = new Set(retainedImportLocals);
  return importRecord.specifiers.some((specifier) => retained.has(specifier.local));
}

export function collectForcedRetainedDeclarations(graph, emittedModules) {
  const forced = new Map();
  const moduleFilenames = new Set(graph.modules.map((moduleRecord) => moduleRecord.filename));

  for (const moduleRecord of graph.modules) {
    if (!emittedModules.has(moduleRecord.filename)) {
      continue;
    }
    for (const dependency of moduleRecord.dependencies) {
      if (dependency.resolved == null || !moduleFilenames.has(dependency.resolved)) {
        continue;
      }
      for (const specifier of dependency.specifiers) {
        if (specifier.kind === "namespace") {
          continue;
        }
        const imported = specifier.imported === "default" ? "__default_export__" : specifier.imported;
        if (!forced.has(dependency.resolved)) {
          forced.set(dependency.resolved, new Set());
        }
        forced.get(dependency.resolved).add(imported);
      }
    }
  }

  return forced;
}

export function collectForcedRetainedImportLocals(graph, forcedRetainedDeclarations) {
  const forcedImports = new Map();

  for (const moduleRecord of graph.modules) {
    const forcedDeclarations = forcedRetainedDeclarations.get(moduleRecord.filename);
    if (forcedDeclarations == null || forcedDeclarations.size === 0) {
      continue;
    }
    for (const reference of collectDeclarationReferences(moduleRecord)) {
      if (!forcedDeclarations.has(reference.name)) {
        continue;
      }
      if (!forcedImports.has(moduleRecord.filename)) {
        forcedImports.set(moduleRecord.filename, new Set());
      }
      for (const importName of reference.importReferences) {
        forcedImports.get(moduleRecord.filename).add(importName);
      }
    }
  }

  return forcedImports;
}

export function collectRetainedDeclarationImportLocals(moduleRecord, retainedDeclarationNames) {
  if (retainedDeclarationNames == null) {
    return null;
  }
  const retained = new Set(retainedDeclarationNames);
  const referencesByName = new Map(
    collectDeclarationReferences(moduleRecord).map((reference) => [reference.name, reference])
  );
  const pending = [...retained];
  const imports = new Set();

  while (pending.length > 0) {
    const name = pending.pop();
    const reference = referencesByName.get(name);
    if (reference == null) {
      continue;
    }
    for (const importName of reference.importReferences) {
      imports.add(importName);
    }
    for (const localName of reference.localReferences) {
      if (retained.has(localName)) {
        continue;
      }
      retained.add(localName);
      pending.push(localName);
    }
  }
  return imports;
}
