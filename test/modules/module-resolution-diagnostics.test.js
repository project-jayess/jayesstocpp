import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";
import { JayessError } from "../../src/diagnostics.js";

test("module-resolution diagnostics distinguish missing installed packages", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-package.js")),
    (error) =>
      error instanceof JayessError
      && /Cannot resolve package import 'missing-lib'/.test(error.diagnostics[0].message)
      && /package 'missing-lib' was not found in node_modules/.test(error.diagnostics[0].message)
  );
});

test("module-resolution diagnostics distinguish unsupported transpile targets inside installed packages", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/bad-file-type.js")),
    (error) =>
      error instanceof JayessError
      && /resolved.*unsupported file type '\.json'/.test(error.diagnostics[0].message)
      && /not a transpileable Jayess package/.test(error.diagnostics[0].message)
      && /Only Jayess source files/.test(error.diagnostics[0].message)
  );
});

test("module-resolution diagnostics explain unsupported conditional export maps", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/conditional-only-package.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json exports mapping/.test(error.diagnostics[0].message)
      && /checked conditions 'jayess', 'import', 'default'/.test(error.diagnostics[0].message)
      && /supported Jayess source target/.test(error.diagnostics[0].message)
  );
});
