import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpileFile text and file standard-library output compiles", (t) => {
  const targetDir = createManagedTempDir(t, "text-file-stdlib-compile");
  const fixture = path.resolve("test/fixtures/modules/text-file-stdlib-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_csv_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_ini_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_glob_index_js.cpp")));
});
