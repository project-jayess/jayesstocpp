import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves async coordination modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/async-thread-coordination-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:async"));
  assert.ok(sources.includes("jayess:channel"));
  assert.ok(sources.includes("jayess:workqueue"));
  assert.ok(sources.includes("jayess:thread"));
});
