import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves http signed-session helper dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/http-session-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:http"));
  assert.ok(sources.includes("jayess:cookie"));
  assert.ok(sources.includes("jayess:crypto"));
  assert.ok(sources.includes("jayess:encoding"));
});
