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

test("module graph resolves repository-owned built-in filesystem modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/fs-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:fs");
});

test("module graph resolves repository-owned built-in string modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/string-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:string");
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

test("module graph resolves repository-owned built-in regex modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/regex-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "builtin-module");
  assert.equal(graph.modules[0].dependencies[0].source, "jayess:regex");
});

test("module graph resolves repository-owned system modules", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/system-modules-main.js"));
  assert.equal(graph.modules.length, 4);
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

test("module graph resolves mixed named re-export and export-all graphs", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/mixed-reexport-main.js"));
  assert.equal(graph.modules.length, 4);
});

test("module graph keeps export-all from forwarding default exports", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/export-all-default-main.js")),
    (error) => error instanceof JayessError && /does not export 'default'/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects packages that expose only unsupported conditional exports", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/conditional-only-package.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json exports mapping/.test(error.diagnostics[0].message)
      && /conditional-only-lib/.test(error.diagnostics[0].message)
  );
});

test("module graph accepts import and export clauses with trailing commas", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/trailing-commas-main.js"));
  assert.equal(graph.modules.length, 2);
});
