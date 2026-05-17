import { throwDiagnostics } from "../diagnostics.js";
import { createModuleFileDiagnostic } from "../diagnostics/module-diagnostic.js";
import { hasExport } from "./module-surface.js";
import { expandExportSurfaces } from "./export-surface.js";

function toImportedExportName(specifier) {
  return specifier.imported === "default" ? "default" : specifier.imported;
}

function createMissingExportDiagnostic(moduleRecord, dependency, exportName) {
  return createModuleFileDiagnostic(
    moduleRecord.filename,
    `Module '${dependency.source}' does not export '${exportName}'`,
    dependency.source
  );
}

export function validateModuleGraph(graph) {
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const exportSurfaces = expandExportSurfaces(graph);
  const diagnostics = [];

  for (const moduleRecord of graph.modules) {
    for (const dependency of moduleRecord.dependencies) {
      if ((dependency.kind !== "jayess-module" && dependency.kind !== "builtin-module" && dependency.kind !== "package") || dependency.resolved == null) {
        continue;
      }

      const targetModule = moduleByFilename.get(dependency.resolved);
      if (targetModule == null) {
        continue;
      }

      for (const specifier of dependency.specifiers ?? []) {
        if (specifier.kind === "namespace") {
          continue;
        }

        const exportName = toImportedExportName(specifier);
        const targetExports = exportSurfaces.get(targetModule.filename)?.exports ?? targetModule.analysis.exports;
        if (!hasExport(targetExports, exportName)) {
          diagnostics.push(createMissingExportDiagnostic(moduleRecord, dependency, exportName));
        }
      }
    }
  }

  if (diagnostics.length > 0) {
    throwDiagnostics(diagnostics);
  }
}
