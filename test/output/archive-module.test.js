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

function generatedStdlibFileCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_js`.replace(/-/g, "_");
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts.slice(0, -1), `${stem}.cpp`);
}

test("transpileFile resolves built-in Jayess archive module with runtime output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-archive-output");
  const fixture = path.resolve("test/fixtures/modules/archive-main.js");
  const result = transpileFile(fixture, targetDir);

  const archivePath = generatedStdlibCppPath(targetDir, "archive");
  const archiveDirectoryPath = generatedStdlibFileCppPath(targetDir, "archive/directories");
  const archiveFilePath = generatedStdlibFileCppPath(targetDir, "archive/tar-files");
  assert.ok(result.files.includes(archivePath));
  assert.ok(result.files.includes(archiveDirectoryPath));
  assert.ok(result.files.includes(archiveFilePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "archive-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(archivePath, "utf8");
  const directoryModuleSource = fs.readFileSync(archiveDirectoryPath, "utf8");
  const fileModuleSource = fs.readFileSync(archiveFilePath, "utf8");
  assert.match(headerSource, /value archive_create_tar\(const value& entries\);/);
  assert.match(headerSource, /value archive_extract_tar\(const value& bytes\);/);
  assert.match(cppSource, /value archive_create_tar\(const value& entries\)/);
  assert.match(cppSource, /archive_entry_mtime/);
  assert.match(cppSource, /archive entry paths must be unique/);
  assert.match(moduleSource, /stdlib_jayess_archive_tar_files_js/);
  assert.match(moduleSource, /stdlib_jayess_archive_directories_js/);
  assert.match(directoryModuleSource, /createTarFromDirectorySync/);
  assert.match(directoryModuleSource, /extractTarToDirectorySync/);
  assert.match(directoryModuleSource, /Jayess archive directory helper paths must not contain \.\./);
  assert.match(directoryModuleSource, /writeBytesSync/);
  assert.match(directoryModuleSource, /walkSync/);
  assert.match(fileModuleSource, /writeBytes/);
  assert.match(fileModuleSource, /readBytes/);
});
