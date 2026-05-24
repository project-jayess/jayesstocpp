import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves markup and data standard-library modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/markup-data-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:xml"));
  assert.ok(sources.includes("jayess:yaml"));
  assert.ok(sources.includes("jayess:markdown"));
  assert.ok(sources.includes("jayess:html"));
});
