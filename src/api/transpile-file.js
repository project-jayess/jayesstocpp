import fs from "node:fs";
import path from "node:path";
import { emitModule } from "../cpp/emit-module.js";
import { buildModuleGraph } from "../modules/module-graph.js";
import { expandExportSurfaces } from "../modules/export-surface.js";
import { ensureInsideTarget, planModulePaths } from "../output/path-plan.js";
import { writeSharedLibraryLayout } from "../output/write-shared-library-layout.js";
import { writeRuntime } from "../output/write-runtime.js";

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
  const outputs = [...writeRuntime(resolvedTargetDir)];

  const graph = buildModuleGraph(entryFilename);
  const exportSurfaces = expandExportSurfaces(graph);
  const metadata = new Map();

  for (const moduleRecord of graph.modules) {
    const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, resolvedTargetDir);
    metadata.set(moduleRecord.filename, {
      moduleStem: paths.moduleStem,
      header: `${paths.moduleStem}.hpp`,
      namespace: `jayess_module_${paths.moduleStem}`,
      exportNames: exportSurfaces.get(moduleRecord.filename)?.exportNames ?? []
    });
  }

  for (const moduleRecord of graph.modules) {
    const paths = planModulePaths(moduleRecord.filename, graph.projectRoot, resolvedTargetDir);
    if (!ensureInsideTarget(resolvedTargetDir, paths.headerPath) || !ensureInsideTarget(resolvedTargetDir, paths.cppPath)) {
      throw new Error("Refusing to write outside target directory");
    }

    const dependencies = new Map();
    const includeOverrides = new Map();
    for (const entry of moduleRecord.dependencies) {
      if (entry.kind === "jayess-module" || entry.kind === "builtin-module" || entry.kind === "package") {
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

  if (options.projectKind === "shared-library") {
    const entryPaths = planModulePaths(graph.entryFilename, graph.projectRoot, resolvedTargetDir);
    const entryMetadata = metadata.get(graph.entryFilename);
    const sharedLayoutFiles = writeSharedLibraryLayout(resolvedTargetDir, {
      libraryName: options.libraryName ?? "jayess_module",
      entryHeader: `${entryPaths.moduleStem}.hpp`,
      entryNamespace: entryMetadata.namespace
    });
    outputs.push(...sharedLayoutFiles);
  }

  return {
    entryFilename: graph.entryFilename,
    projectRoot: graph.projectRoot,
    targetDirname: resolvedTargetDir,
    files: outputs.sort()
  };
}
