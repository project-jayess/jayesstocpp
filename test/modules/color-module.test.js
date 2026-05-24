import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in color module and pure helper dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/color-main.js"));
  const entry = graph.modules[0];

  assert.equal(entry.dependencies[0].kind, "builtin-module");
  assert.equal(entry.dependencies[0].source, "jayess:color");
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:color"));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:math"));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:number"));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:string"));
});
