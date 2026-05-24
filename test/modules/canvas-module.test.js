import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in canvas module and rendering dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/canvas-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("jayess:image"));
  assert.ok(sources.includes("jayess:color"));
  assert.ok(sources.includes("jayess:math"));
});
