import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const stem = `stdlib_jayess_${subpath}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", subpath, `${stem}.cpp`);
}

test("transpileFile emits compress module runtime and native bridge output", (t) => {
  const targetDir = createManagedTempDir(t, "compress-output");
  const fixture = path.resolve("test/fixtures/modules/compress-main.js");
  const result = transpileFile(fixture, targetDir);

  const compressPath = generatedStdlibCppPath(targetDir, "compress");
  const primitivePath = path.join(targetDir, "native", "compress-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.ok(result.files.includes(compressPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(headerSource, /value compress_gzip\(const value& bytes\);/);
  assert.match(headerSource, /value compress_inflate\(const value& bytes\);/);
  assert.match(cppSource, /compress_deflate_stored_bytes/);
  assert.match(cppSource, /compress_inflate_stored_bytes/);
  assert.match(cppSource, /compress_crc32/);
  assert.match(cppSource, /Jayess compress gunzip found malformed gzip data/);
  assert.match(plan, /"source": "jayess:compress"/);
});
