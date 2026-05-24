import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves web and data standard-library modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/web-data-stdlib-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source).filter((source) => source?.startsWith("jayess:"));

  assert.ok(sources.includes("jayess:querystring"));
  assert.ok(sources.includes("jayess:mime"));
  assert.ok(sources.includes("jayess:form"));
  assert.ok(sources.includes("jayess:toml"));
  assert.ok(sources.includes("jayess:log"));
  assert.ok(sources.includes("jayess:console"));
  assert.ok(sources.includes("jayess:json"));
});
