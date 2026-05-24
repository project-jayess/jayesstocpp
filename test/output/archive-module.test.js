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

test("transpileFile resolves built-in Jayess archive module with runtime output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-archive-output");
  const fixture = path.resolve("test/fixtures/modules/archive-main.js");
  const result = transpileFile(fixture, targetDir);

  const archivePath = generatedStdlibCppPath(targetDir, "archive");
  assert.ok(result.files.includes(archivePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "archive-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(archivePath, "utf8");
  assert.match(headerSource, /value archive_create_tar\(const value& entries\);/);
  assert.match(headerSource, /value archive_extract_tar\(const value& bytes\);/);
  assert.match(cppSource, /value archive_create_tar\(const value& entries\)/);
  assert.match(cppSource, /value archive_read_tar_sync\(const value& pathValue\)/);
  assert.match(moduleSource, /writeTarSync/);
  assert.match(moduleSource, /readTarSync/);
});
