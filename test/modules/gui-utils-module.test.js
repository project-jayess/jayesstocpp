import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves GUI utility modules and canvas dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/gui-utils-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:layout"));
  assert.ok(sources.includes("jayess:font"));
  assert.ok(sources.includes("jayess:clipboard"));
  assert.ok(sources.includes("jayess:canvas"));
});
