import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves crypto certificate trust helper dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/crypto-trust-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:crypto"));
  assert.ok(sources.includes("./certificate-trust.js"));
  assert.ok(sources.includes("./certificate-fingerprint.js"));
  assert.ok(sources.includes("./pem-metadata.js"));
});
