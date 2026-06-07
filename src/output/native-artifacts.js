import fs from "node:fs";
import path from "node:path";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleFileDiagnostic } from "../diagnostics/module-diagnostic.js";

export function isNativeArtifactImport(importRecord) {
  return (
    importRecord.kind === "native-header" ||
    importRecord.kind === "native-source" ||
    importRecord.kind === "shared-library" ||
    importRecord.kind === "static-library" ||
    importRecord.kind === "font-asset"
  );
}

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
    case "font-asset":
      return "font asset";
    default:
      return "native artifact";
  }
}

export function copyNativeArtifact(targetDirname, sourceFilename, importRecord) {
  if (!isNativeArtifactImport(importRecord)) {
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
  const bucket = importRecord.kind === "shared-library" || importRecord.kind === "static-library"
    ? "libraries"
    : importRecord.kind === "font-asset"
      ? "assets/fonts"
      : "native";
  const toPath = path.join(targetDirname, bucket, path.basename(importRecord.source));
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
  return path.relative(targetDirname, toPath).replace(/\\/g, "/");
}

export function nativeArtifactMetadata(moduleRecord, importRecord, outputPath) {
  if (outputPath == null) {
    return null;
  }
  return {
    importerFilename: path.resolve(moduleRecord.filename),
    source: importRecord.source,
    kind: importRecord.kind,
    outputPath
  };
}
