import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpileFile web and data stdlib output compiles with the available C++ compiler", (t) => {
  const targetDir = createManagedTempDir(t, "web-data-stdlib-compile");
  const fixture = path.resolve("test/fixtures/modules/web-data-stdlib-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_querystring_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_mime_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_form_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_toml_index_js.cpp")));
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_log_index_js.cpp")));
});
