import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves canvas HTML/CSS renderer helpers and GUI bridge", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/canvas-html-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("jayess:gui"));
  assert.ok(sources.includes("jayess:layout"));
  assert.ok(sources.includes("jayess:color"));
});
