import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";
import { JayessError } from "../../src/diagnostics.js";

test("module graph resolves relative imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph reports missing modules clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/missing.js")),
    (error) => error instanceof JayessError && /Cannot resolve module/.test(error.diagnostics[0].message)
  );
});

test("module graph supports extensionless relative imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/extensionless-main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph deduplicates repeated imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/repeated-main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph preserves side effect import order", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/side-effect-main.js"));
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["./setup.js", "./math.js"]
  );
});

test("module graph detects cycles", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/cycle-a.js")),
    (error) => error instanceof JayessError && /Import cycle detected/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves bare and scoped packages", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/main.js"));
  assert.equal(graph.modules.length, 3);
});

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

test("module graph resolves repository-owned system modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/system-modules-main.js"));
  assert.equal(graph.modules.length, 4);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.kind),
    ["builtin-module", "builtin-module", "builtin-module"]
  );
});

test("module graph rejects missing packages clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-package.js")),
    (error) => error instanceof JayessError && /package 'missing-lib' was not found in node_modules/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects package targets that are not Jayess source files", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/bad-file-type.js")),
    (error) => error instanceof JayessError && /unsupported file type '.json'/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects Node built-in imports clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/node-builtin-main.js")),
    (error) =>
      error instanceof JayessError
      && /does not support Node built-in modules inside source imports: 'node:fs'/.test(error.diagnostics[0].message)
      && /jayess:fs/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects packages with missing entry files clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-entry-package.js")),
    (error) => error instanceof JayessError && /has no transpileable entry file/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects imports of missing exported names", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/bad-import-name.js")),
    (error) => error instanceof JayessError && /does not export 'missing'/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects re-exports of missing exported names", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/bad-reexport-name.js")),
    (error) => error instanceof JayessError && /does not export 'missing'/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves export-all surfaces for downstream imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/export-all-main.js"));
  assert.equal(graph.modules.length, 3);
});

test("module graph accepts import and export clauses with trailing commas", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/trailing-commas-main.js"));
  assert.equal(graph.modules.length, 2);
});
