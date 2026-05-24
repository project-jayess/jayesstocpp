import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in validate module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/validate-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:validate"));
  assert.ok(sources.includes("jayess:array"));
  assert.ok(sources.includes("jayess:object"));
});
