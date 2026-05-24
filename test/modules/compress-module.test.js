import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned compress module and bytes dependency", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/compress-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:compress"));
  assert.ok(sources.includes("jayess:bytes"));
});
