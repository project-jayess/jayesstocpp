import fs from "node:fs";
import path from "node:path";

function normalizeFile(filename) {
  return filename == null ? null : path.resolve(filename);
}

function moduleLifetimeEntry(moduleRecord, lifetimeMetadata, lifetimeEmission) {
  return {
    sourceFilename: normalizeFile(moduleRecord.filename),
    lifetime: lifetimeMetadata,
    emission: lifetimeEmission
  };
}

export function writeLifetimeMetadata(targetDirname, graph, lifetimeMetadataByModule, lifetimeEmissionByModule) {
  const outputPath = path.join(targetDirname, "jayess_lifetime.json");
  const modules = graph.modules.map((moduleRecord) =>
    moduleLifetimeEntry(
      moduleRecord,
      lifetimeMetadataByModule.get(moduleRecord.filename),
      lifetimeEmissionByModule.get(moduleRecord.filename)
    )
  );

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({
      kind: "jayess-lifetime-metadata",
      entryFilename: normalizeFile(graph.entryFilename),
      modules
    }, null, 2)}\n`,
    "utf8"
  );
  return outputPath;
}
