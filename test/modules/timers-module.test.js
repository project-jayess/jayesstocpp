import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in timers module and async dependency", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/timers-main.js"));

  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:timers"]
  );
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:timers"));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:async"));
});
