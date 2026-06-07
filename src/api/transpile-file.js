import fs from "node:fs";
import path from "node:path";
import { emitModule } from "../cpp/emit-module.js";
import { analyzeEscapes } from "../lifetime/analyze-escapes.js";
import { createModuleLifetimeMetadata } from "../lifetime/module-lifetime-metadata.js";
import { buildModuleGraph } from "../modules/module-graph.js";
import { analyzeReachableSymbols } from "../modules/reachable-symbols.js";
import {
  createEmittedModuleSet,
  collectForcedRetainedDeclarations,
  collectForcedRetainedImportLocals,
  collectRetainedDeclarationImportLocals,
  retainedDeclarationNamesFor,
  retainedImportLocalNamesFor,
  shouldCopyNativeArtifact,
  shouldRetainModuleDependency,
} from "../output/emitted-module-plan.js";
import { planEmittedModuleMetadata } from "../output/module-metadata-plan.js";
import { copyNativeArtifact, nativeArtifactMetadata } from "../output/native-artifacts.js";
import { ensureInsideTarget, planModulePaths } from "../output/path-plan.js";
import { analyzeRuntimeFeatures } from "../output/runtime-feature-analysis.js";
import { writeBuildHints } from "../output/write-build-hints.js";
import { writeDependencyPlan } from "../output/write-dependency-plan.js";
import { entryMainFunction, writeExecutableLayout } from "../output/write-executable-layout.js";
import { writeLifetimeMetadata } from "../output/write-lifetime-metadata.js";
import { writeProjectManifests } from "../output/write-project-manifests.js";
import { writeSharedLibraryLayout } from "../output/write-shared-library-layout.js";
import { writeRuntime } from "../output/write-runtime.js";
import { resolveRuntimeFragmentKeys } from "../cpp/runtime-fragments.js";

export function transpileFile(entryFilename, targetDirname, options = {}) {
  if (typeof entryFilename !== "string" || entryFilename.length === 0) {
    throw new TypeError("transpileFile(entryFilename, targetDirname, options) requires a non-empty entryFilename");
  }
  if (typeof targetDirname !== "string" || targetDirname.length === 0) {
    throw new TypeError("transpileFile(entryFilename, targetDirname, options) requires a non-empty targetDirname");
  }

  const resolvedTargetDir = path.resolve(targetDirname);
  fs.mkdirSync(resolvedTargetDir, { recursive: true });

  const graph = buildModuleGraph(entryFilename);
  const reachableSymbols = analyzeReachableSymbols(graph);
  const emittedModules = createEmittedModuleSet(graph, reachableSymbols);
  const runtimeFeatures = options.runtimeFeatures ?? analyzeRuntimeFeatures(graph, { reachableSymbols, emittedModules });
  const runtimeFragmentInput = options.runtimeFragments === "all" ? "all" : runtimeFeatures;
  const runtimeFragmentKeys = resolveRuntimeFragmentKeys(runtimeFragmentInput);
  const outputs = [...writeRuntime(resolvedTargetDir, { features: runtimeFragmentInput })];
  const forcedRetainedDeclarations = collectForcedRetainedDeclarations(graph, emittedModules);
  const forcedRetainedImportLocals = collectForcedRetainedImportLocals(graph, forcedRetainedDeclarations);
  const { metadata } = planEmittedModuleMetadata(graph, resolvedTargetDir, reachableSymbols);
  const lifetimeMetadataByModule = new Map(graph.modules.map((moduleRecord) => {
    const lifetime = analyzeEscapes(moduleRecord.ast);
    return [moduleRecord.filename, createModuleLifetimeMetadata(moduleRecord.ast, lifetime)];
  }));
  const lifetimeEmissionByModule = new Map();
  const retainedNativeArtifacts = [];

  for (const moduleRecord of graph.modules) {
    if (!emittedModules.has(moduleRecord.filename)) {
      continue;
    }
    const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, resolvedTargetDir);
    if (!ensureInsideTarget(resolvedTargetDir, paths.headerPath) || !ensureInsideTarget(resolvedTargetDir, paths.cppPath)) {
      throw new Error("Refusing to write outside target directory");
    }
    fs.mkdirSync(path.dirname(paths.headerPath), { recursive: true });
    fs.mkdirSync(path.dirname(paths.cppPath), { recursive: true });

    const dependencies = new Map();
    const includeOverrides = new Map();
    const forcedForModule = forcedRetainedDeclarations.get(moduleRecord.filename);
    const rawForcedImportsForModule = forcedRetainedImportLocals.get(moduleRecord.filename);
    const forcedImportsForModule = rawForcedImportsForModule != null && rawForcedImportsForModule.size > 0
      ? rawForcedImportsForModule
      : null;
    const retainedDeclarationNames = retainedDeclarationNamesFor(
      moduleRecord,
      reachableSymbols,
      forcedForModule
    );
    const retainedDeclarationImportLocals = collectRetainedDeclarationImportLocals(moduleRecord, retainedDeclarationNames);
    const baseRetainedImportLocalNames = retainedImportLocalNamesFor(moduleRecord, reachableSymbols);
    const retainedImportLocalNames = retainedDeclarationNames == null
      ? null
      : (
          baseRetainedImportLocalNames == null && retainedDeclarationImportLocals == null && forcedImportsForModule == null
            ? null
            : [...new Set([
                ...(baseRetainedImportLocalNames ?? []),
                ...(retainedDeclarationImportLocals ?? []),
                ...(forcedImportsForModule ?? [])
              ])].sort()
        );
    for (const entry of moduleRecord.dependencies) {
      if (
        (entry.kind === "jayess-module" || entry.kind === "builtin-module" || entry.kind === "package" || entry.kind === "package-import")
        && shouldRetainModuleDependency(moduleRecord, entry, reachableSymbols)
      ) {
        const dependencyMetadata = metadata.get(entry.resolved);
        if (dependencyMetadata != null) {
          dependencies.set(entry.source, dependencyMetadata);
        }
      }
      const copiedPath = shouldCopyNativeArtifact(moduleRecord, entry, reachableSymbols, false, retainedImportLocalNames)
        ? copyNativeArtifact(resolvedTargetDir, moduleRecord.filename, entry)
        : null;
      if (entry.kind === "native-header" && copiedPath != null) {
        includeOverrides.set(entry.source, copiedPath);
      }
      const artifactMetadata = nativeArtifactMetadata(moduleRecord, entry, copiedPath);
      if (artifactMetadata != null) {
        retainedNativeArtifacts.push(artifactMetadata);
      }
    }

    const emitted = emitModule({
      ast: moduleRecord.ast,
      analysis: moduleRecord.analysis,
      moduleStem: paths.moduleStem,
      dependencies,
      includeOverrides,
      lifetimeMetadata: lifetimeMetadataByModule.get(moduleRecord.filename),
      retainedDeclarationNames,
      retainedImportLocalNames
    });
    lifetimeEmissionByModule.set(moduleRecord.filename, emitted.lifetimeEmission);

    fs.writeFileSync(paths.headerPath, emitted.headerSource, "utf8");
    fs.writeFileSync(paths.cppPath, emitted.cppSource, "utf8");
    outputs.push(paths.headerPath, paths.cppPath);
  }

  outputs.push(writeLifetimeMetadata(resolvedTargetDir, graph, lifetimeMetadataByModule, lifetimeEmissionByModule));
  outputs.push(writeDependencyPlan(resolvedTargetDir, graph, metadata));
  outputs.push(...writeProjectManifests(resolvedTargetDir, graph, metadata, runtimeFragmentKeys, { retainedNativeArtifacts }));

  if (options.projectKind === "shared-library") {
    const entryPaths = planModulePaths(graph.entryFilename, graph.projectRoot, resolvedTargetDir);
    const entryMetadata = metadata.get(graph.entryFilename);
    const sharedLayoutFiles = writeSharedLibraryLayout(resolvedTargetDir, {
      libraryName: options.libraryName ?? "jayess_module",
      entryHeader: entryPaths.headerIncludePath,
      entryNamespace: entryMetadata.namespace
    });
    outputs.push(...sharedLayoutFiles);
  } else {
    const entryModule = graph.modules.find((moduleRecord) => moduleRecord.filename === graph.entryFilename);
    const mainFunction = entryModule == null ? null : entryMainFunction(entryModule.ast);
    if (mainFunction != null) {
      const entryPaths = planModulePaths(graph.entryFilename, graph.projectRoot, resolvedTargetDir);
      const entryMetadata = metadata.get(graph.entryFilename);
      outputs.push(...writeExecutableLayout(resolvedTargetDir, {
        entryHeader: entryPaths.headerIncludePath,
        entryNamespace: entryMetadata.namespace,
        mainFunction
      }));
    }
  }

  outputs.push(writeBuildHints(resolvedTargetDir, outputs, { runtimeFeatures: runtimeFragmentKeys }));

  return {
    entryFilename: graph.entryFilename,
    projectRoot: graph.projectRoot,
    targetDirname: resolvedTargetDir,
    files: outputs.sort()
  };
}
