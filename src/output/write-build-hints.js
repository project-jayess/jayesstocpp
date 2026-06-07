import fs from "node:fs";
import path from "node:path";
import {
  platformAdapterMetadataForFeatures,
  runtimeRequirementsForFeatures
} from "./platform-adapter-metadata.js";

function toRelative(targetDirname, filename) {
  return path.relative(targetDirname, filename).split(path.sep).join("/");
}

function existingDirectory(targetDirname, dirname) {
  return fs.existsSync(path.join(targetDirname, dirname));
}

function collectFiles(targetDirname, dirname) {
  const root = path.join(targetDirname, dirname);
  if (!fs.existsSync(root)) {
    return [];
  }
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  };
  visit(root);
  return files.map((file) => toRelative(targetDirname, file)).sort();
}

function includeDirectoryDetails(includeDirectories) {
  const rationale = new Map([
    [".", "generated module headers and entry sources"],
    ["native", "copied native bridge headers"],
    ["runtime", "Jayess runtime headers"]
  ]);
  return includeDirectories.map((directory) => ({
    directory,
    rationale: rationale.get(directory) ?? "generated include directory"
  }));
}

function platformLibraryHints(runtimeFeatures) {
  return platformAdapterMetadataForFeatures(runtimeFeatures ?? [])
    .map((adapter) => ({
      feature: adapter.feature,
      libraries: adapter.platformLibraries
    }))
    .filter((hint) => hint.libraries.length > 0);
}

function systemFontDiscoveryMetadata(runtimeFeatures) {
  const retained = (runtimeFeatures ?? []).includes("font");
  return {
    enabledByRuntimeFragment: retained,
    runtimeFragment: retained ? "font" : null,
    fallbackFont: "jayess-default-5x7",
    mayUseFallbackAtRuntime: retained
  };
}

export function writeBuildHints(targetDirname, outputs, options = {}) {
  const relativeOutputs = outputs.map((file) => toRelative(targetDirname, file)).sort();
  const sourceFiles = relativeOutputs.filter((file) => file.endsWith(".cpp"));
  const includeDirectories = ["."]
    .concat(existingDirectory(targetDirname, "runtime") ? ["runtime"] : [])
    .concat(existingDirectory(targetDirname, "native") ? ["native"] : [])
    .sort();
  const payload = {
    kind: "jayess-build-hints",
    cxxStandard: "C++17",
    sourceFiles,
    includeDirectories,
    includeDirectoryDetails: includeDirectoryDetails(includeDirectories),
    runtimeFiles: relativeOutputs.filter((file) => file.startsWith("runtime/")),
    nativeArtifacts: collectFiles(targetDirname, "native"),
    fontArtifacts: collectFiles(targetDirname, "assets/fonts"),
    systemFontDiscovery: systemFontDiscoveryMetadata(options.runtimeFeatures ?? []),
    libraryArtifacts: collectFiles(targetDirname, "libraries"),
    platformAdapters: platformAdapterMetadataForFeatures(options.runtimeFeatures ?? []),
    platformLibraryHints: platformLibraryHints(options.runtimeFeatures ?? []),
    runtimeRequirements: runtimeRequirementsForFeatures(options.runtimeFeatures)
  };
  const outputPath = path.join(targetDirname, "jayess_build_hints.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outputPath;
}
