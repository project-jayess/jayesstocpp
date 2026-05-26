import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile resolves built-in Jayess validate module with type primitive", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-validate-output");
  const fixture = path.resolve("test/fixtures/modules/validate-main.js");
  const result = transpileFile(fixture, targetDir);

  const validatePath = generatedStdlibCppPath(targetDir, "validate");
  assert.ok(result.files.includes(validatePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "validate-primitives.hpp")));

  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(validatePath, "utf8");
  assert.match(runtimeHeader, /value validate_type_of\(const value& input\);/);
  assert.match(runtimeSource, /value validate_type_of\(const value& input\)/);
  assert.match(moduleSource, /objectOf/);
  assert.match(moduleSource, /strictObjectOf/);
  assert.match(moduleSource, /config/);
  assert.match(moduleSource, /is not allowed/);
  assert.match(moduleSource, /assertValid/);
});
