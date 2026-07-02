import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in canvas module and rendering dependencies", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/canvas-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("./state.js"));
  assert.ok(sources.includes("./shapes.js"));
  assert.ok(sources.includes("jayess:image"));
  assert.ok(sources.includes("jayess:color"));
  assert.ok(sources.includes("jayess:math"));
});

test("module graph resolves canvas XML scene helpers through jayess:xml", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/canvas-xml-scene-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("./xml-scene.js"));
  assert.ok(sources.includes("./xml-attributes.js"));
  assert.ok(sources.includes("jayess:xml"));
  assert.ok(sources.includes("jayess:color"));
  assert.ok(!sources.includes("jayess:gui"));
  assert.ok(!sources.includes("jayess:window"));
});

test("module graph resolves canvas XML renderer without GUI or window", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/canvas-xml-render-main.js"));
  const sources = graph.modules.map((moduleRecord) => moduleRecord.source);

  assert.ok(sources.includes("jayess:canvas"));
  assert.ok(sources.includes("./xml-scene.js"));
  assert.ok(sources.includes("./xml-attributes.js"));
  assert.ok(sources.includes("./xml-renderer.js"));
  assert.ok(sources.includes("jayess:xml"));
  assert.ok(!sources.includes("jayess:gui"));
  assert.ok(!sources.includes("jayess:window"));
});
