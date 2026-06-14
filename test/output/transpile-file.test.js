import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { JayessError } from "../../src/diagnostics.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

function assertGeneratedStdlibModule(result, targetDir, subpath) {
  const modulePath = generatedStdlibCppPath(targetDir, subpath);
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  return modulePath;
}

function transpileFileWithFullRuntime(fixture, targetDir) {
  return transpileFile(fixture, targetDir, { runtimeFragments: "all" });
}

test("transpileFile writes generated files under target", (t) => {
  const targetDir = createManagedTempDir(t, "project-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "runtime", "jayess_runtime.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "runtime", "jayess_runtime.cpp")));
  assert.ok(result.files.every((file) => file.startsWith(targetDir)));
});

test("transpileFile resolves async Jayess filesystem defaults into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-async-output");
  const fixture = path.resolve("test/fixtures/modules/fs-async-main.js");
  const result = transpileFile(fixture, targetDir);

  const fsModulePath = assertGeneratedStdlibModule(result, targetDir, "fs");
  assert.ok(result.files.some((file) => file.endsWith("fs_async_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "fs-primitives.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(fsModulePath, "utf8");
  assert.match(primitiveSource, /fs_read_text_file_async/);
  assert.match(primitiveSource, /fs_write_text_file_async/);
  assert.match(runtimeSource, /async_schedule\(\[result, operation = std::move\(operation\)\]\(\) mutable \{/);
  assert.match(moduleSource, /jayessFsReadText/);
  assert.match(moduleSource, /jayessFsWriteText/);
});

test("transpileFile accepts modules that use trailing commas", (t) => {
  const targetDir = createManagedTempDir(t, "trailing-commas-output");
  const fixture = path.resolve("test/fixtures/modules/trailing-commas-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("trailing_commas_main_js.cpp")));
});

test("transpileFile embeds canvas HTML and CSS assets into generated C++", (t) => {
  const targetDir = createManagedTempDir(t, "asset-embed-output");
  const fixture = path.resolve("test/fixtures/modules/asset-embed-main.js");
  const result = transpileFile(fixture, targetDir);

  const sourcePath = result.files.find((file) => file.endsWith("asset_embed_main_js.cpp"));
  assert.ok(sourcePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  assert.match(source, /Embedded HTML asset/);
  assert.match(source, /asset-probe/);
  assert.match(source, /calc\(100% \/ 2\)/);
  assert.doesNotMatch(source, /packHtml/);
  assert.doesNotMatch(source, /packCss/);
  assert.ok(!fs.existsSync(path.join(targetDir, "asset-embed.html")));
  assert.ok(!fs.existsSync(path.join(targetDir, "asset-embed.css")));
});
