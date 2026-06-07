import fs from "node:fs";
import path from "node:path";
import { expandExportSurfaces } from "../modules/export-surface.js";
import {
  classifyImportForm,
  importBindings,
  requestedNamedImportNames,
  resolveReachableExports,
  wholeModuleReasonForImportForm
} from "../modules/import-reachability.js";
import { analyzeReachableSymbols } from "../modules/reachable-symbols.js";
import {
  dependencyInclusionReason,
  runtimeFeaturesForJayessSource,
  runtimeRequirementsForFeatures
} from "./platform-adapter-metadata.js";

function normalizeFile(filename) {
  return filename == null ? null : path.resolve(filename);
}

function normalizeTracePath(filename) {
  return filename == null ? null : path.resolve(filename).split(path.sep).join("/");
}

function normalizeArrayTrace(trace) {
  return trace.map((entry) => ({
    ...entry,
    resolved: normalizeTracePath(entry.resolved),
    attemptedPath: normalizeTracePath(entry.attemptedPath)
  }));
}

function moduleStemFor(metadata, filename) {
  return metadata.get(filename)?.moduleStem ?? null;
}

function moduleMetadataFor(metadata, filename) {
  return filename == null ? null : metadata.get(filename) ?? null;
}

function runtimeRequirementsForGraph(graph) {
  const features = graph.modules.flatMap((moduleRecord) =>
    moduleRecord.dependencies.flatMap((dependency) => runtimeFeaturesForJayessSource(dependency.source))
  );
  return runtimeRequirementsForFeatures(features);
}

function systemFontDiscoveryForGraph(graph) {
  const enabled = graph.modules.some((moduleRecord) =>
    moduleRecord.dependencies.some((dependency) => dependency.source === "jayess:font")
  );
  return {
    enabledByRuntimeFragment: enabled,
    runtimeFragment: enabled ? "font" : null,
    fallbackFont: "jayess-default-5x7",
    mayUseFallbackAtRuntime: enabled
  };
}

function artifactOutputPath(dependency) {
  if (dependency.kind === "shared-library" || dependency.kind === "static-library") {
    return `libraries/${path.basename(dependency.source)}`;
  }
  if (dependency.kind === "native-header" || dependency.kind === "native-source") {
    return `native/${path.basename(dependency.source)}`;
  }
  if (dependency.kind === "font-asset") {
    return `assets/fonts/${path.basename(dependency.source)}`;
  }
  return null;
}

function compareNullableText(left, right) {
  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return 1;
  }
  if (right == null) {
    return -1;
  }
  return left.localeCompare(right);
}

function comparePlanModules(left, right) {
  const leftEntry = left.sourceFilename === left.entryFilename;
  const rightEntry = right.sourceFilename === right.entryFilename;
  if (leftEntry !== rightEntry) {
    return leftEntry ? -1 : 1;
  }

  const bySource = compareNullableText(left.sourceFilename, right.sourceFilename);
  if (bySource !== 0) {
    return bySource;
  }

  return compareNullableText(left.moduleStem, right.moduleStem);
}

export function writeDependencyPlan(targetDirname, graph, metadata) {
  const planPath = path.join(targetDirname, "jayess_dependency_plan.json");
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const exportSurfaces = expandExportSurfaces(graph);
  const reachableSymbols = analyzeReachableSymbols(graph);
  const modules = graph.modules.map((moduleRecord) => {
    const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
    const reachability = reachableSymbols.get(moduleRecord.filename);
    return {
      entryFilename: normalizeFile(graph.entryFilename),
      sourceFilename: normalizeFile(moduleRecord.filename),
      sourceKind: moduleMetadata?.sourceKind ?? "source-module",
      moduleStem: moduleMetadata?.moduleStem ?? null,
      generatedHeaderPath: moduleMetadata?.headerOutputPath ?? null,
      generatedSourcePath: moduleMetadata?.cppOutputPath ?? null,
      reachability: {
        declarationReferences: reachability?.declarationReferences ?? [],
        reachableExports: reachability?.reachableExports ?? [],
        retainedExports: reachability?.retainedExports ?? [],
        prunedExports: reachability?.prunedExports ?? [],
        retainedLocalDeclarations: reachability?.retainedLocalDeclarations ?? [],
        retainedImportLocals: reachability?.retainedImportLocals ?? [],
        wholeModuleReasons: reachability?.wholeModuleReasons ?? []
      },
      dependencies: moduleRecord.dependencies.map((dependency) => {
        const dependencyMetadata = moduleMetadataFor(metadata, dependency.resolved);
        const importForm = classifyImportForm(dependency.specifiers);
        const reachableExports = resolveReachableExports({
          dependency,
          targetModule: moduleByFilename.get(dependency.resolved),
          exportSurface: exportSurfaces.get(dependency.resolved),
          moduleByFilename,
          exportSurfaces
        }).map((entry) => ({
          ...entry,
          originFilename: normalizeFile(entry.originFilename)
        }));
        const runtimeFeatures = runtimeFeaturesForJayessSource(dependency.source);
        return {
          source: dependency.source,
          kind: dependency.kind,
          importForm,
          requestedImportNames: requestedNamedImportNames(dependency.specifiers),
          importBindings: importBindings(dependency.specifiers),
          reachableExports,
          wholeModuleReason: wholeModuleReasonForImportForm(importForm),
          inclusionReason: dependencyInclusionReason(dependency, runtimeFeatures),
          resolvedFilename: normalizeFile(dependency.resolved),
          sourceKind: dependencyMetadata?.sourceKind ?? null,
          moduleStem: dependency.resolved == null ? null : moduleStemFor(metadata, dependency.resolved),
          generatedHeaderPath: dependencyMetadata?.headerOutputPath ?? null,
          generatedSourcePath: dependencyMetadata?.cppOutputPath ?? null,
          outputPath: artifactOutputPath(dependency),
          packageName: dependency.packageName ?? null,
          packageRoot: normalizeFile(dependency.packageRoot),
          packageResolutionMode: dependency.packageResolutionMode ?? null,
          packageField: dependency.packageField ?? null,
          packageExportKey: dependency.packageExportKey ?? null,
          packageExportPatternMatch: dependency.packageExportPatternMatch ?? null,
          packageExportCondition: dependency.packageExportCondition ?? null,
          packageExportConditionTrace: dependency.packageExportConditionTrace ?? [],
          packageExportRejectedConditions: dependency.packageExportRejectedConditions ?? [],
          packageExportConditionDecisions: dependency.packageExportConditionDecisions ?? [],
          packageExportArrayTrace: normalizeArrayTrace(dependency.packageExportArrayTrace ?? []),
          packageImportKey: dependency.packageImportKey ?? null,
          packageImportPatternMatch: dependency.packageImportPatternMatch ?? null,
          packageImportCondition: dependency.packageImportCondition ?? null,
          packageImportConditionTrace: dependency.packageImportConditionTrace ?? [],
          packageImportRejectedConditions: dependency.packageImportRejectedConditions ?? [],
          packageImportConditionDecisions: dependency.packageImportConditionDecisions ?? [],
          packageImportArrayTrace: normalizeArrayTrace(dependency.packageImportArrayTrace ?? []),
          packageMainField: dependency.packageMainField ?? null,
          packageResolutionTrace: dependency.packageResolutionTrace ?? [],
          packageRequestedSubpath: dependency.packageRequestedSubpath ?? null,
          packageAllowedExtensions: dependency.packageAllowedExtensions ?? [],
          runtimeFeatures,
          runtimeRequirements: runtimeRequirementsForFeatures(runtimeFeatures)
        };
      })
    };
  }).sort(comparePlanModules)
    .map(({ entryFilename, ...modulePlan }) => modulePlan);

  fs.writeFileSync(
    planPath,
    `${JSON.stringify({
      entryFilename: normalizeFile(graph.entryFilename),
      projectRoot: normalizeFile(graph.projectRoot),
      runtimeRequirements: runtimeRequirementsForGraph(graph),
      systemFontDiscovery: systemFontDiscoveryForGraph(graph),
      modules
    }, null, 2)}\n`,
    "utf8"
  );
  return planPath;
}
