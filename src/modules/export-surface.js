import { findExportByName } from "./module-surface.js";

function isConcreteExport(exportRecord) {
  return exportRecord.exportedName !== "*" && exportRecord.exportedName !== "default";
}

export function listConcreteExportNames(exports) {
  return exports
    .filter(isConcreteExport)
    .map((exportRecord) => exportRecord.exportedName)
    .sort();
}

export function expandExportSurfaces(graph) {
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const cache = new Map();

  function resolveSurface(moduleRecord) {
    const cached = cache.get(moduleRecord.filename);
    if (cached != null) {
      return cached;
    }

    const surface = new Map();
    cache.set(moduleRecord.filename, surface);

    for (const exportRecord of moduleRecord.analysis.exports) {
      if (exportRecord.exportedName === "*") {
        const dependency = moduleRecord.dependencies.find((entry) => entry.source === exportRecord.source);
        if (dependency?.resolved == null) {
          continue;
        }

        const targetModule = moduleByFilename.get(dependency.resolved);
        if (targetModule == null) {
          continue;
        }

        for (const [exportedName, nestedExportRecord] of resolveSurface(targetModule)) {
          if (exportedName === "default") {
            continue;
          }
          if (!surface.has(exportedName)) {
            surface.set(exportedName, nestedExportRecord);
          }
        }
        continue;
      }

      if (!surface.has(exportRecord.exportedName)) {
        surface.set(exportRecord.exportedName, exportRecord);
      }
    }

    return surface;
  }

  const expanded = new Map();
  for (const moduleRecord of graph.modules) {
    const surface = resolveSurface(moduleRecord);
    const exports = [];

    for (const exportRecord of moduleRecord.analysis.exports) {
      if (exportRecord.exportedName !== "*") {
        exports.push(exportRecord);
      }
    }

    for (const [exportedName, exportRecord] of surface) {
      if (findExportByName(exports, exportedName) == null) {
        exports.push(exportRecord);
      }
    }

    expanded.set(moduleRecord.filename, {
      exports,
      exportNames: listConcreteExportNames(exports)
    });
  }

  return expanded;
}
