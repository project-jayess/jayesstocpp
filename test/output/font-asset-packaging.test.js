import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile copies imported font assets under target metadata", (t) => {
  const targetDir = createManagedTempDir(t, "font-asset-output");
  const fixture = path.resolve("test/fixtures/modules/font-assets-main.js");
  const result = transpileFile(fixture, targetDir);

  const ttfPath = path.join(targetDir, "assets", "fonts", "probe.ttf");
  const woffPath = path.join(targetDir, "assets", "fonts", "probe.woff");
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  const planPath = path.join(targetDir, "jayess_dependency_plan.json");
  const reachabilityPath = path.join(targetDir, "jayess_reachability.json");

  assert.ok(result.files.includes(hintsPath));
  assert.ok(fs.existsSync(ttfPath));
  assert.ok(fs.existsSync(woffPath));

  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  assert.deepEqual(hints.fontArtifacts, [
    "assets/fonts/probe.ttf",
    "assets/fonts/probe.woff"
  ]);

  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === fixture);
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies
      .filter((dependency) => dependency.kind === "font-asset")
      .map((dependency) => ({
        source: dependency.source,
        outputPath: dependency.outputPath ?? null
      })),
    [
      { source: "./fonts/probe.ttf", outputPath: "assets/fonts/probe.ttf" },
      { source: "./fonts/probe.woff", outputPath: "assets/fonts/probe.woff" }
    ]
  );

  const reachability = JSON.parse(fs.readFileSync(reachabilityPath, "utf8"));
  assert.deepEqual(
    reachability.retainedNativeArtifacts
      .filter((artifact) => artifact.kind === "font-asset")
      .map((artifact) => ({
        source: artifact.source,
        outputPath: artifact.outputPath
      })),
    [
      { source: "./fonts/probe.ttf", outputPath: "assets/fonts/probe.ttf" },
      { source: "./fonts/probe.woff", outputPath: "assets/fonts/probe.woff" }
    ]
  );
});
