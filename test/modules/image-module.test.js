import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in image module and color dependency", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/image-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:image"));
  assert.ok(sources.includes("jayess:color"));
  assert.ok(sources.includes("jayess:bytes"));
  assert.ok(sources.includes("jayess:math"));
  assert.ok(sources.includes("jayess:string"));
});
