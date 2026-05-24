import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves jayess:html and helper dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/html-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:html"));
  assert.ok(sources.includes("jayess:array"));
  assert.ok(sources.includes("jayess:object"));
  assert.ok(sources.includes("jayess:string"));
});
