import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves http request helper dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/http-request-helpers-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:http"));
  assert.ok(sources.includes("./request.js"));
  assert.ok(sources.includes("jayess:querystring"));
});
