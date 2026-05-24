import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in buffer module and byte dependency", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/buffer-main.js"));

  assert.equal(graph.modules[0].dependencies[1].kind, "builtin-module");
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:bytes", "jayess:buffer"]
  );
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:buffer"));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.source === "jayess:bytes"));
});
