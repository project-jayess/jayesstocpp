import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves test standard-library dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/test-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:test"));
  assert.ok(sources.includes("jayess:assert"));
  assert.ok(sources.includes("jayess:async"));
});
