import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpile can pass analyzeEscapes lifetime metadata into C++ emission", () => {
  const cpp = transpile("var stable = 1; function run(x) { return x; }", {
    emitLifetimeMetadataComment: true,
    moduleName: "lifetime_comment"
  });

  assert.match(cpp, /Jayess lifetime emission: module-state-bindings/);
  assert.match(cpp, /Jayess retained module-state bindings: run, stable/);
  assert.match(cpp, /Jayess lifetime fallback: broad-runtime-value-ownership/);
});

test("transpileFile writes lifetime metadata and C++ emission plans for modules", (t) => {
  const targetDir = createManagedTempDir(t, "lifetime-metadata-output");
  const fixture = path.resolve("test/fixtures/modules/lifetime-first-slice-main.js");
  const result = transpileFile(fixture, targetDir);
  const lifetimePath = path.join(targetDir, "jayess_lifetime.json");
  const manifest = JSON.parse(fs.readFileSync(lifetimePath, "utf8"));
  const entry = manifest.modules.find((moduleRecord) => moduleRecord.sourceFilename === path.resolve(fixture));

  assert.ok(result.files.includes(lifetimePath));
  assert.equal(manifest.kind, "jayess-lifetime-metadata");
  assert.ok(entry.lifetime.localBindings.includes("ordinary"));
  assert.ok(entry.lifetime.returnedValues.includes("closure"));
  assert.ok(entry.lifetime.thrownValues.includes("errorValue"));
  assert.ok(entry.lifetime.capturedBindings.includes("ordinary"));
  assert.equal(entry.emission.supportedValueCategory, "module-state-bindings");
  assert.equal(entry.emission.fallback.strategy, "broad-runtime-value-ownership");
});
