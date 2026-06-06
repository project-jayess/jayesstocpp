import fs from "node:fs";
import path from "node:path";
import { emitModule } from "../cpp/emit-module.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleFileDiagnostic } from "../diagnostics/module-diagnostic.js";
import { buildModuleGraph } from "../modules/module-graph.js";
import { expandExportSurfaces } from "../modules/export-surface.js";
import { ensureInsideTarget, planModulePaths } from "../output/path-plan.js";
import { analyzeRuntimeFeatures } from "../output/runtime-feature-analysis.js";
import { writeBuildHints } from "../output/write-build-hints.js";
import { writeDependencyPlan } from "../output/write-dependency-plan.js";
import { entryMainFunction, writeExecutableLayout } from "../output/write-executable-layout.js";
import { writeProjectManifests } from "../output/write-project-manifests.js";
import { writeSharedLibraryLayout } from "../output/write-shared-library-layout.js";
import { writeRuntime } from "../output/write-runtime.js";
import { resolveRuntimeFragmentKeys } from "../cpp/runtime-fragments.js";

function describeNativeArtifact(kind) {
  switch (kind) {
    case "native-header":
      return "native header file";
    case "native-source":
      return "native source file";
    case "shared-library":
      return "shared library artifact";
    case "static-library":
      return "static library artifact";
    default:
      return "native artifact";
  }
}

function copyIfNativeArtifact(targetDirname, sourceFilename, importRecord) {
  if (
    importRecord.kind !== "native-header" &&
    importRecord.kind !== "native-source" &&
    importRecord.kind !== "shared-library" &&
    importRecord.kind !== "static-library"
  ) {
    return null;
  }

  const fromPath = path.resolve(path.dirname(sourceFilename), importRecord.source);
  const artifactLabel = describeNativeArtifact(importRecord.kind);
  if (!fs.existsSync(fromPath)) {
    throwDiagnostics([
      createModuleFileDiagnostic(
        sourceFilename,
        `Cannot copy ${importRecord.kind} import '${importRecord.source}': expected an existing ${artifactLabel} to package into the generated project`,
        importRecord.source
      )
    ]);
  }
  if (!fs.statSync(fromPath).isFile()) {
    throwDiagnostics([
      createModuleFileDiagnostic(
        sourceFilename,
        `Cannot copy ${importRecord.kind} import '${importRecord.source}': expected a file, but found a non-file path while packaging the ${artifactLabel}`,
        importRecord.source
      )
    ]);
  }
  const bucket = importRecord.kind === "shared-library" || importRecord.kind === "static-library" ? "libraries" : "native";
  const toPath = path.join(targetDirname, bucket, path.basename(importRecord.source));
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
  return path.relative(targetDirname, toPath).replace(/\\/g, "/");
}

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
  const runtimeFeatures = options.runtimeFeatures ?? analyzeRuntimeFeatures(graph);
  const runtimeFragmentInput = options.runtimeFragments === "all" ? "all" : runtimeFeatures;
  const runtimeFragmentKeys = resolveRuntimeFragmentKeys(runtimeFragmentInput);
  const outputs = [...writeRuntime(resolvedTargetDir, { features: runtimeFragmentInput })];
  const exportSurfaces = expandExportSurfaces(graph);
  const metadata = new Map();

  for (const moduleRecord of graph.modules) {
    const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, resolvedTargetDir);
    metadata.set(moduleRecord.filename, {
      moduleStem: paths.moduleStem,
      header: paths.headerIncludePath,
      headerPath: paths.headerPath,
      cppPath: paths.cppPath,
      headerOutputPath: paths.headerIncludePath,
      cppOutputPath: paths.cppOutputPath,
      sourceKind: paths.sourceKind,
      namespace: `jayess_module_${paths.moduleStem}`,
      exportNames: exportSurfaces.get(moduleRecord.filename)?.exportNames ?? []
    });
  }

  for (const moduleRecord of graph.modules) {
    const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, resolvedTargetDir);
    if (!ensureInsideTarget(resolvedTargetDir, paths.headerPath) || !ensureInsideTarget(resolvedTargetDir, paths.cppPath)) {
      throw new Error("Refusing to write outside target directory");
    }
    fs.mkdirSync(path.dirname(paths.headerPath), { recursive: true });
    fs.mkdirSync(path.dirname(paths.cppPath), { recursive: true });

    const dependencies = new Map();
    const includeOverrides = new Map();
    for (const entry of moduleRecord.dependencies) {
      if (entry.kind === "jayess-module" || entry.kind === "builtin-module" || entry.kind === "package" || entry.kind === "package-import") {
        const dependencyMetadata = metadata.get(entry.resolved);
        dependencies.set(entry.source, dependencyMetadata);
      }
      const copiedPath = copyIfNativeArtifact(resolvedTargetDir, moduleRecord.filename, entry);
      if (entry.kind === "native-header" && copiedPath != null) {
        includeOverrides.set(entry.source, copiedPath);
      }
    }

    const emitted = emitModule({
      ast: moduleRecord.ast,
      analysis: moduleRecord.analysis,
      moduleStem: paths.moduleStem,
      dependencies,
      includeOverrides
    });

    fs.writeFileSync(paths.headerPath, emitted.headerSource, "utf8");
    fs.writeFileSync(paths.cppPath, emitted.cppSource, "utf8");
    outputs.push(paths.headerPath, paths.cppPath);
  }

  outputs.push(writeDependencyPlan(resolvedTargetDir, graph, metadata));
  outputs.push(...writeProjectManifests(resolvedTargetDir, graph, metadata, runtimeFragmentKeys));

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
