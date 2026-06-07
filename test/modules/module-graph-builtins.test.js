import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";

test("module graph resolves repository-owned built-in modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/date-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in map modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/map-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in set modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/set-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in object modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/object-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:object");
});

test("module graph resolves repository-owned built-in number modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/number-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in math modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/math-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:math");
});

test("module graph resolves repository-owned built-in iterator modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/iter-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:iter");
});

test("module graph resolves repository-owned built-in path modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/path-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:path");
});

test("module graph resolves repository-owned built-in os modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/os-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:os");
});

test("module graph resolves repository-owned built-in filesystem modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/fs-main.js"));
  assert.equal(graph.modules.length, 17);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:fs");
});

test("module graph resolves repository-owned filesystem binary helper modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/fs-binary-main.js"));
  assert.equal(graph.modules.length, 17);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:bytes", "jayess:fs"]
  );
});

test("module graph resolves repository-owned built-in string modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/string-main.js"));
  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:string", "jayess:regex"]
  );
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in array modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/array-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:array");
});

test("module graph resolves repository-owned built-in async modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/async-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in time modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/time-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:time");
});

test("module graph preserves closed dependencies for async module initialization", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/system-modules-main.js"));
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:fs", "jayess:path", "jayess:process"]
  );
  assert.ok(graph.modules.every((moduleRecord) => path.isAbsolute(moduleRecord.filename)));
});

test("module graph resolves repository-owned built-in regex modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/regex-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:regex");
});

test("module graph resolves repository-owned system modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/system-modules-main.js"));
  assert.equal(graph.modules.length, 18);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.kind),
    ["builtin-module", "builtin-module", "builtin-module"]
  );
});

test("module graph resolves repository-owned built-in system module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/system-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:system");
});

test("module graph resolves repository-owned built-in thread module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/thread-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:thread");
});

test("module graph resolves repository-owned built-in console module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/console-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:console");
});

test("module graph resolves repository-owned built-in bytes module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/bytes-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:bytes");
});

test("module graph resolves repository-owned built-in encoding module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/encoding-main.js"));
  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:bytes", "jayess:encoding"]
  );
  assert.equal(graph.modules[0].dependencies[1].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in crypto module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/crypto-main.js"));
  assert.equal(graph.modules.length, 9);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["jayess:bytes", "jayess:encoding", "jayess:crypto"]
  );
  assert.equal(graph.modules[0].dependencies[2].kind, "builtin-module");
});

test("module graph resolves repository-owned built-in url module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/url-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:url");
});

test("module graph resolves repository-owned built-in assert module", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/assert-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:assert");
});
