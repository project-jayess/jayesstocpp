import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves kv standard-library dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/kv-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:kv"));
  assert.ok(sources.includes("jayess:fs"));
  assert.ok(sources.includes("jayess:path"));
  assert.ok(sources.includes("jayess:json"));
  assert.ok(sources.includes("jayess:string"));
});
