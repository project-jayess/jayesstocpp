import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpileFile built-in image module project compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-image-project-compile");
  const fixture = path.resolve("test/fixtures/modules/image-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
});
