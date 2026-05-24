import fs from "node:fs";
import path from "node:path";
import { builtinModuleRelativePath } from "../modules/builtin-root.js";

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
            return {
              source: dependency.source,
              kind: dependency.kind,
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
  return {
    kind: "jayess-dependency-graph",
    entryFilename: normalizeFile(graph.entryFilename),
    modules: graph.modules.map((moduleRecord) => {
      const moduleMetadata = moduleMetadataFor(metadata, moduleRecord.filename);
      return {
        sourceFilename: normalizeFile(moduleRecord.filename),
        sourceKind: moduleMetadata?.sourceKind ?? "source-module",
        standardLibrarySpecifier: standardLibrarySpecifier(moduleRecord.filename),
        dependencies: moduleRecord.dependencies.map((dependency) => ({
          source: dependency.source,
          kind: dependency.kind,
          resolvedFilename: normalizeFile(dependency.resolved),
          standardLibrarySpecifier: standardLibrarySpecifier(dependency.resolved)
        }))
      };
    })
  };
}

export function writeProjectManifests(targetDirname, graph, metadata, runtimeFragmentKeys) {
  return [
    writeJson(targetDirname, "jayess_module_manifest.json", moduleManifest(graph, metadata)),
    writeJson(targetDirname, "jayess_runtime_features.json", {
      kind: "jayess-runtime-features",
      fragments: [...runtimeFragmentKeys].sort()
    }),
    writeJson(targetDirname, "jayess_dependency_graph.json", dependencyGraphSummary(graph, metadata))
  ];
}
