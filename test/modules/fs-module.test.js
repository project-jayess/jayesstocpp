import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves recursive filesystem helper fixture", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/fs-recursive-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:fs"));
});
