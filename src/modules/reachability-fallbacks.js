import { declarationPruningFallbackReason } from "./declaration-pruning-shape.js";
import { findExportByName } from "./module-surface.js";

export function moduleWholeReason(moduleRecord, exportSurface, moduleByFilename) {
  const reason = ambiguousExportAllReason(moduleRecord, moduleByFilename);
  if (reason != null) {
    return reason;
  }
  return declarationPruningFallbackReason(moduleRecord.ast);
}

function ambiguousExportAllReason(moduleRecord, moduleByFilename) {
  const forwardedNames = new Set();
  for (const exportRecord of moduleRecord.analysis.exports.filter((entry) => entry.kind === "export-all")) {
    const dependency = moduleRecord.dependencies.find((entry) => entry.source === exportRecord.source);
    const targetModule = moduleByFilename.get(dependency?.resolved);
    if (targetModule == null) {
      continue;
    }
    for (const targetExport of targetModule.analysis.exports) {
      if (targetExport.exportedName === "*" || targetExport.exportedName === "default") {
        continue;
      }
      if (findExportByName(moduleRecord.analysis.exports, targetExport.exportedName) != null) {
        continue;
      }
      if (forwardedNames.has(targetExport.exportedName)) {
        return "ambiguous-export-all";
      }
      forwardedNames.add(targetExport.exportedName);
    }
  }
  return null;
}
