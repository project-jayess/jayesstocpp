import fs from "node:fs";
import path from "node:path";
import {
  dependencyInclusionReason,
  runtimeFeaturesForJayessSource,
  runtimeRequirementsForFeatures
} from "./platform-adapter-metadata.js";

function normalizeFile(filename) {
  return filename == null ? null : path.resolve(filename);
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

export function writeDependencyPlan(targetDirname, graph, metadata) {
  const planPath = path.join(targetDirname, "jayess_dependency_plan.json");
  const modules = graph.modules.map((moduleRecord) => {
    const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
    return {
      sourceFilename: normalizeFile(moduleRecord.filename),
      sourceKind: moduleMetadata?.sourceKind ?? "source-module",
      moduleStem: moduleMetadata?.moduleStem ?? null,
      generatedHeaderPath: moduleMetadata?.headerOutputPath ?? null,
      generatedSourcePath: moduleMetadata?.cppOutputPath ?? null,
      dependencies: moduleRecord.dependencies.map((dependency) => {
        const dependencyMetadata = moduleMetadataFor(metadata, dependency.resolved);
        const runtimeFeatures = runtimeFeaturesForJayessSource(dependency.source);
        return {
          source: dependency.source,
          kind: dependency.kind,
          inclusionReason: dependencyInclusionReason(dependency, runtimeFeatures),
          resolvedFilename: normalizeFile(dependency.resolved),
          sourceKind: dependencyMetadata?.sourceKind ?? null,
          moduleStem: dependency.resolved == null ? null : moduleStemFor(metadata, dependency.resolved),
          generatedHeaderPath: dependencyMetadata?.headerOutputPath ?? null,
          generatedSourcePath: dependencyMetadata?.cppOutputPath ?? null,
          packageName: dependency.packageName ?? null,
          packageRoot: normalizeFile(dependency.packageRoot),
          packageResolutionMode: dependency.packageResolutionMode ?? null,
          packageField: dependency.packageField ?? null,
          packageExportKey: dependency.packageExportKey ?? null,
          packageExportPatternMatch: dependency.packageExportPatternMatch ?? null,
          packageExportCondition: dependency.packageExportCondition ?? null,
          packageExportConditionTrace: dependency.packageExportConditionTrace ?? [],
          packageExportRejectedConditions: dependency.packageExportRejectedConditions ?? [],
          packageExportArrayTrace: dependency.packageExportArrayTrace ?? [],
          packageImportKey: dependency.packageImportKey ?? null,
          packageImportPatternMatch: dependency.packageImportPatternMatch ?? null,
          packageImportCondition: dependency.packageImportCondition ?? null,
          packageImportConditionTrace: dependency.packageImportConditionTrace ?? [],
          packageImportRejectedConditions: dependency.packageImportRejectedConditions ?? [],
          packageImportArrayTrace: dependency.packageImportArrayTrace ?? [],
          packageMainField: dependency.packageMainField ?? null,
          packageResolutionTrace: dependency.packageResolutionTrace ?? [],
          packageRequestedSubpath: dependency.packageRequestedSubpath ?? null,
          packageAllowedExtensions: dependency.packageAllowedExtensions ?? [],
          runtimeFeatures,
          runtimeRequirements: runtimeRequirementsForFeatures(runtimeFeatures)
        };
      })
    };
  });

  fs.writeFileSync(
    planPath,
    `${JSON.stringify({
      entryFilename: normalizeFile(graph.entryFilename),
      projectRoot: normalizeFile(graph.projectRoot),
      runtimeRequirements: runtimeRequirementsForGraph(graph),
      modules
    }, null, 2)}\n`,
    "utf8"
  );
  return planPath;
}
