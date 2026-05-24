import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in archive module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/archive-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:archive"));
  assert.ok(sources.includes("jayess:bytes"));
});
