import { expandExportSurfaces } from "../modules/export-surface.js";
import { planModulePaths } from "./path-plan.js";
import { createEmittedModuleSet } from "./emitted-module-plan.js";

function collectLocalFunctionNames(ast) {
  const names = new Set();
  for (const statement of ast.body) {
    if (statement.type === "FunctionDeclaration" && statement.id != null) {
      names.add(statement.id.name);
      continue;
    }
    if (statement.type === "ExportNamedDeclaration" && statement.declaration?.type === "FunctionDeclaration") {
      names.add(statement.declaration.id.name);
      continue;
    }
    if (statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "FunctionDeclaration" && statement.declaration.id != null) {
      names.add(statement.declaration.id.name);
    }
  }
  return names;
}

function collectExportedFunctionNames(ast) {
  const localFunctionNames = collectLocalFunctionNames(ast);
  const exportedFunctionNames = new Set();

  for (const statement of ast.body) {
    if (statement.type === "ExportNamedDeclaration" && statement.declaration?.type === "FunctionDeclaration") {
      exportedFunctionNames.add(statement.declaration.id.name);
      continue;
    }
    if (statement.type === "ExportNamedDeclaration" && statement.declaration == null) {
      for (const specifier of statement.specifiers ?? []) {
        if (localFunctionNames.has(specifier.localName)) {
          exportedFunctionNames.add(specifier.exportedName);
        }
      }
      continue;
    }
    if (statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "FunctionDeclaration") {
      exportedFunctionNames.add("__default_export__");
    }
  }

  return [...exportedFunctionNames].sort();
}

export function createModuleMetadata(moduleRecord, graph, targetDirname, exportSurfaces) {
  const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, targetDirname);
  return {
    moduleStem: paths.moduleStem,
    header: paths.headerIncludePath,
    headerPath: paths.headerPath,
    cppPath: paths.cppPath,
    headerOutputPath: paths.headerIncludePath,
    cppOutputPath: paths.cppOutputPath,
    sourceKind: paths.sourceKind,
    namespace: `jayess_module_${paths.moduleStem}`,
    exportNames: exportSurfaces.get(moduleRecord.filename)?.exportNames ?? [],
    exportedFunctionNames: collectExportedFunctionNames(moduleRecord.ast)
  };
}

export function planEmittedModuleMetadata(graph, targetDirname, reachableSymbols) {
  const exportSurfaces = expandExportSurfaces(graph);
  const metadata = new Map();
  const emittedModules = createEmittedModuleSet(graph, reachableSymbols);

  for (const moduleRecord of graph.modules) {
    if (!emittedModules.has(moduleRecord.filename)) {
      continue;
    }
    metadata.set(moduleRecord.filename, createModuleMetadata(moduleRecord, graph, targetDirname, exportSurfaces));
  }

  return { exportSurfaces, metadata, emittedModules };
}
