import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

compileTest("transpileFile crypto PEM metadata project compiles", (t) => {
  const targetDir = createManagedTempDir(t, "crypto-pem-metadata-compile");
  const fixture = path.resolve("test/fixtures/modules/crypto-pem-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(cppFiles.some((file) => file.includes("crypto_pem_main_js.cpp")));
});

compileTest("transpileFile crypto certificate trust project compiles", (t) => {
  const targetDir = createManagedTempDir(t, "crypto-trust-compile");
  const fixture = path.resolve("test/fixtures/modules/crypto-trust-main.js");
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(cppFiles.some((file) => file.includes("stdlib_jayess_crypto_certificate_trust_js.cpp")));
});
