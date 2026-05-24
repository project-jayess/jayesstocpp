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

test("transpileFile resolves built-in Jayess console module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-console-output");
  const fixture = path.resolve("test/fixtures/modules/console-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("console_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_console_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "console-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "console-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessConsoleLog/);
  assert.match(nativeHeader, /jayessConsoleError/);
  assert.match(nativeHeader, /jayessConsoleWrite/);
  assert.match(nativeHeader, /jayessConsoleWriteLine/);
  assert.match(moduleSource, /jayessConsoleLog/);
  assert.match(moduleSource, /jayessConsoleWriteLine/);
});

test("transpileFile resolves built-in Jayess bytes module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-bytes-output");
  const fixture = path.resolve("test/fixtures/modules/bytes-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("bytes_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_bytes_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "bytes-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "bytes-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessBytesFromUtf8/);
  assert.match(nativeHeader, /jayessBytesFromArray/);
  assert.match(nativeHeader, /jayessBytesToArray/);
  assert.match(nativeHeader, /jayessBytesGet/);
  assert.match(nativeHeader, /jayessBytesFill/);
  assert.match(nativeHeader, /jayessBytesCompare/);
  assert.match(nativeHeader, /jayessBytesStartsWith/);
  assert.match(nativeHeader, /jayessBytesToUtf8/);
  assert.match(nativeHeader, /jayessBytesSlice/);
  assert.match(nativeHeader, /jayessBytesEquals/);
  assert.match(nativeHeader, /jayessBytesIsBytes/);
  assert.match(moduleSource, /jayessBytesFromUtf8/);
  assert.match(moduleSource, /jayessBytesEquals/);
});

test("transpileFile resolves built-in Jayess stream module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-stream-output");
  const fixture = path.resolve("test/fixtures/modules/stream-main.js");
  const result = transpileFile(fixture, targetDir);

  const streamModulePath = assertGeneratedStdlibModule(result, targetDir, "stream");
  assert.ok(result.files.some((file) => file.endsWith("stream_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "stream-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "stream-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(streamModulePath, "utf8");

  assert.match(headerSource, /struct stream_state/);
  assert.match(headerSource, /using stream_ptr = std::shared_ptr<stream_state>;/);
  assert.match(headerSource, /value stream_open_read_async\(const std::string& pathText\);/);
  assert.match(headerSource, /value stream_open_read\(const std::string& pathText\);/);
  assert.match(cppSource, /value stream_read_chunk_async\(const value& input, int size\)/);
  assert.match(cppSource, /throw_closed_handle\("stream", "stream"\)/);
  assert.match(primitiveSource, /jayessStreamOpenRead/);
  assert.match(primitiveSource, /jayessStreamOpenReadSync/);
  assert.match(primitiveSource, /jayessStreamWriteChunk/);
  assert.match(moduleSource, /jayessStreamReadChunk/);
  assert.match(moduleSource, /jayessStreamClose/);
});

test("transpileFile resolves built-in Jayess events module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-events-output");
  const fixture = path.resolve("test/fixtures/modules/events-main.js");
  const result = transpileFile(fixture, targetDir);

  const eventsModulePath = assertGeneratedStdlibModule(result, targetDir, "events");
  assert.ok(result.files.some((file) => file.endsWith("events_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "events-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "events-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(eventsModulePath, "utf8");

  assert.match(headerSource, /struct event_emitter/);
  assert.match(headerSource, /using event_emitter_ptr = std::shared_ptr<event_emitter>;/);
  assert.match(headerSource, /value events_emit\(const value& emitter, const std::string& name, const value& args\);/);
  assert.match(cppSource, /value events_listener_count\(const value& emitter, const std::string& name\)/);
  assert.match(cppSource, /std::remove_if\(storage->listeners\.begin\(\), storage->listeners\.end\(\)/);
  assert.match(primitiveSource, /jayessEventsCreate/);
  assert.match(primitiveSource, /jayessEventsListenerCount/);
  assert.match(moduleSource, /jayessEventsEmit/);
  assert.match(moduleSource, /jayessEventsOnce/);
});

test("transpileFile resolves built-in Jayess encoding module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-encoding-output");
  const fixture = path.resolve("test/fixtures/modules/encoding-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("encoding_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_encoding_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "encoding-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "encoding-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessEncodingBase64Encode/);
  assert.match(nativeHeader, /jayessEncodingBase64Decode/);
  assert.match(nativeHeader, /jayessEncodingHexEncode/);
  assert.match(nativeHeader, /jayessEncodingUriDecode/);
  assert.match(moduleSource, /jayessEncodingBase64Encode/);
  assert.match(moduleSource, /jayessEncodingUriDecode/);
});

test("transpileFile resolves built-in Jayess crypto module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-crypto-output");
  const fixture = path.resolve("test/fixtures/modules/crypto-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("crypto_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_crypto_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "crypto-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "crypto-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessCryptoSha256/);
  assert.match(nativeHeader, /jayessCryptoSha1/);
  assert.match(nativeHeader, /jayessCryptoRandomBytes/);
  assert.match(moduleSource, /jayessCryptoSha256/);
  assert.match(moduleSource, /jayessCryptoRandomBytes/);
});

test("transpileFile resolves built-in Jayess url module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-url-output");
  const fixture = path.resolve("test/fixtures/modules/url-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("url_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_url_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "url-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "url-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessUrlParse/);
  assert.match(nativeHeader, /jayessUrlFormat/);
  assert.match(nativeHeader, /jayessUrlJoinPath/);
  assert.match(nativeHeader, /jayessUrlSetQuery/);
  assert.match(moduleSource, /jayessUrlParse/);
  assert.match(moduleSource, /jayessUrlSetQuery/);
});

test("transpileFile resolves built-in Jayess assert module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-assert-output");
  const fixture = path.resolve("test/fixtures/modules/assert-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("assert_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_assert_index_js.cpp"));
  assert.ok(modulePath);

  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(moduleSource, /Expected value to be truthy/);
  assert.match(moduleSource, /Expected callback to throw/);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === fixture);
  assert.ok(entry);
  assert.equal(entry.dependencies[0].source, "jayess:assert");
  assert.equal(entry.dependencies[0].kind, "builtin-module");
  assert.match(entry.dependencies[0].moduleStem, /stdlib_jayess_assert_index_js/);
  assert.equal(entry.dependencies[0].sourceKind, "repository-stdlib");
  assert.equal(entry.dependencies[0].generatedHeaderPath, "generated-stdlib/jayess/assert/stdlib_jayess_assert_index_js.hpp");
  assert.equal(entry.dependencies[0].generatedSourcePath, "generated-stdlib/jayess/assert/stdlib_jayess_assert_index_js.cpp");
});
