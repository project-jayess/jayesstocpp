import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves window standard-library module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/window-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:window"));
  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("jayess:image"));
});
