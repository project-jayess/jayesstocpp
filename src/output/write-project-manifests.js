import fs from "node:fs";
import path from "node:path";
import { builtinModuleRelativePath } from "../modules/builtin-root.js";
import { expandExportSurfaces } from "../modules/export-surface.js";
import {
  classifyImportForm,
  requestedNamedImportNames,
  resolveReachableExports,
  wholeModuleReasonForImportForm
} from "../modules/import-reachability.js";
import { analyzeReachableSymbols } from "../modules/reachable-symbols.js";

function normalizeFile(filename) {
  return filename == null ? null : path.resolve(filename);
}

function moduleMetadataFor(metadata, filename) {
  return filename == null ? null : metadata.get(filename) ?? null;
}

function standardLibrarySpecifier(filename) {
  const relative = builtinModuleRelativePath(filename);
  if (relative == null) {
    return null;
  }
  const withoutIndex = relative.endsWith("/index.js") ? relative.slice(0, -"/index.js".length) : relative.replace(/\.js$/, "");
  return `jayess:${withoutIndex}`;
}

function writeJson(targetDirname, filename, payload) {
  const outputPath = path.join(targetDirname, filename);
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outputPath;
}

function moduleManifest(graph, metadata) {
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const exportSurfaces = expandExportSurfaces(graph);
  const standardLibraryModules = graph.modules
    .map((moduleRecord) => {
      const specifier = standardLibrarySpecifier(moduleRecord.filename);
      if (specifier == null) {
        return null;
      }
      const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
      return {
        specifier,
        sourceFilename: normalizeFile(moduleRecord.filename),
        generatedHeaderPath: moduleMetadata?.headerOutputPath ?? null,
        generatedSourcePath: moduleMetadata?.cppOutputPath ?? null
      };
    })
    .filter((moduleRecord) => moduleRecord != null)
    .sort((left, right) => left.specifier.localeCompare(right.specifier));

  return {
    kind: "jayess-module-manifest",
    entryFilename: normalizeFile(graph.entryFilename),
    copiedStandardLibraryModules: standardLibraryModules,
    modules: graph.modules.map((moduleRecord) => {
      const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
      return {
        sourceFilename: normalizeFile(moduleRecord.filename),
        sourceKind: moduleMetadata?.sourceKind ?? "source-module",
        standardLibrarySpecifier: standardLibrarySpecifier(moduleRecord.filename),
        moduleStem: moduleMetadata?.moduleStem ?? null,
        namespace: moduleMetadata?.namespace ?? null,
        generatedHeaderPath: moduleMetadata?.headerOutputPath ?? null,
        generatedSourcePath: moduleMetadata?.cppOutputPath ?? null,
        imports: moduleRecord.dependencies
          .filter((dependency) => dependency.resolved != null)
          .map((dependency) => {
            const dependencyMetadata = moduleMetadataFor(metadata, dependency.resolved);
            const importForm = classifyImportForm(dependency.specifiers);
            return {
              source: dependency.source,
              kind: dependency.kind,
              importForm,
              requestedImportNames: requestedNamedImportNames(dependency.specifiers),
              reachableExports: resolveReachableExports({
                dependency,
                targetModule: moduleByFilename.get(dependency.resolved),
                exportSurface: exportSurfaces.get(dependency.resolved),
                moduleByFilename,
                exportSurfaces
              }).map((entry) => ({
                ...entry,
                originFilename: normalizeFile(entry.originFilename)
              })),
              wholeModuleReason: wholeModuleReasonForImportForm(importForm),
              resolvedFilename: normalizeFile(dependency.resolved),
              sourceKind: dependencyMetadata?.sourceKind ?? null,
              standardLibrarySpecifier: standardLibrarySpecifier(dependency.resolved),
              moduleStem: dependencyMetadata?.moduleStem ?? null,
              generatedHeaderPath: dependencyMetadata?.headerOutputPath ?? null,
              generatedSourcePath: dependencyMetadata?.cppOutputPath ?? null
            };
          })
      };
    })
  };
}

function dependencyGraphSummary(graph, metadata) {
  const moduleByFilename = new Map(graph.modules.map((moduleRecord) => [moduleRecord.filename, moduleRecord]));
  const exportSurfaces = expandExportSurfaces(graph);
  return {
    kind: "jayess-dependency-graph",
    entryFilename: normalizeFile(graph.entryFilename),
    modules: graph.modules.map((moduleRecord) => {
      const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
      return {
        sourceFilename: normalizeFile(moduleRecord.filename),
        sourceKind: moduleMetadata?.sourceKind ?? "source-module",
        standardLibrarySpecifier: standardLibrarySpecifier(moduleRecord.filename),
        dependencies: moduleRecord.dependencies.map((dependency) => {
          const importForm = classifyImportForm(dependency.specifiers);
          return {
            source: dependency.source,
            kind: dependency.kind,
            importForm,
            requestedImportNames: requestedNamedImportNames(dependency.specifiers),
            reachableExports: resolveReachableExports({
              dependency,
              targetModule: moduleByFilename.get(dependency.resolved),
              exportSurface: exportSurfaces.get(dependency.resolved),
              moduleByFilename,
              exportSurfaces
            }).map((entry) => ({
              ...entry,
              originFilename: normalizeFile(entry.originFilename)
            })),
            wholeModuleReason: wholeModuleReasonForImportForm(importForm),
            resolvedFilename: normalizeFile(dependency.resolved),
            standardLibrarySpecifier: standardLibrarySpecifier(dependency.resolved)
          };
        })
      };
    })
  };
}

function retainedNativeArtifacts(graph) {
  return graph.modules.flatMap((moduleRecord) =>
    moduleRecord.dependencies
      .filter((dependency) => ["native-header", "native-source", "shared-library", "static-library", "font-asset"].includes(dependency.kind))
      .map((dependency) => ({
        importerFilename: normalizeFile(moduleRecord.filename),
        source: dependency.source,
        kind: dependency.kind,
        outputPath: `${dependency.kind === "shared-library" || dependency.kind === "static-library"
          ? "libraries"
          : dependency.kind === "font-asset"
            ? "assets/fonts"
            : "native"}/${path.basename(dependency.source)}`
      }))
  ).sort((left, right) =>
    `${left.importerFilename}:${left.source}:${left.kind}`.localeCompare(`${right.importerFilename}:${right.source}:${right.kind}`)
  );
}

function normalizeNativeArtifacts(nativeArtifacts) {
  return nativeArtifacts.map((artifact) => ({
    importerFilename: normalizeFile(artifact.importerFilename),
    source: artifact.source,
    kind: artifact.kind,
    outputPath: artifact.outputPath
  })).sort((left, right) =>
    `${left.importerFilename}:${left.source}:${left.kind}`.localeCompare(`${right.importerFilename}:${right.source}:${right.kind}`)
  );
}

function reachableSymbolsManifest(graph, runtimeFragmentKeys, options = {}) {
  const summaries = analyzeReachableSymbols(graph);
  return {
    kind: "jayess-reachable-symbols",
    entryFilename: normalizeFile(graph.entryFilename),
    retainedRuntimeFragments: [...runtimeFragmentKeys].sort(),
    retainedNativeArtifacts: normalizeNativeArtifacts(options.retainedNativeArtifacts ?? retainedNativeArtifacts(graph)),
    modules: graph.modules.map((moduleRecord) => {
      const summary = summaries.get(moduleRecord.filename);
      return {
        sourceFilename: normalizeFile(moduleRecord.filename),
        standardLibrarySpecifier: standardLibrarySpecifier(moduleRecord.filename),
        declarationReferences: summary?.declarationReferences ?? [],
        reachableExports: summary?.reachableExports ?? [],
        retainedExports: summary?.retainedExports ?? [],
        prunedExports: summary?.prunedExports ?? [],
        retainedLocalDeclarations: summary?.retainedLocalDeclarations ?? [],
        retainedImportLocals: summary?.retainedImportLocals ?? [],
        wholeModuleReasons: summary?.wholeModuleReasons ?? []
      };
    })
  };
}

export function writeProjectManifests(targetDirname, graph, metadata, runtimeFragmentKeys, options = {}) {
  return [
    writeJson(targetDirname, "jayess_module_manifest.json", moduleManifest(graph, metadata)),
    writeJson(targetDirname, "jayess_runtime_features.json", {
      kind: "jayess-runtime-features",
      fragments: [...runtimeFragmentKeys].sort()
    }),
    writeJson(targetDirname, "jayess_dependency_graph.json", dependencyGraphSummary(graph, metadata)),
    writeJson(targetDirname, "jayess_reachability.json", reachableSymbolsManifest(graph, runtimeFragmentKeys, options))
  ];
}
