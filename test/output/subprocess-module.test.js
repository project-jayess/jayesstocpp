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

test("transpileFile resolves built-in Jayess subprocess module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-subprocess-output");
  const fixture = path.resolve("test/fixtures/modules/subprocess-main.js");
  const result = transpileFile(fixture, targetDir);

  const modulePath = generatedStdlibCppPath(targetDir, "subprocess");
  assert.ok(result.files.some((file) => file.endsWith("subprocess_main_js.cpp")));
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "subprocess-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "subprocess-primitives.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(primitiveSource, /jayessSubprocessRun/);
  assert.match(primitiveSource, /jayessSubprocessSpawn/);
  assert.match(primitiveSource, /jayessSubprocessJoin/);
  assert.match(primitiveSource, /jayessSubprocessKill/);
  assert.match(primitiveSource, /jayessSubprocessStdout/);
  assert.match(primitiveSource, /jayessSubprocessStderr/);
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(moduleSource, /runText/);
  assert.match(moduleSource, /runBytes/);
  assert.match(moduleSource, /runJson/);
  assert.match(moduleSource, /runWithCancellation/);
  assert.match(moduleSource, /runWithTimeout/);
  assert.match(moduleSource, /runWithTimeoutAndCancellation/);
  assert.match(moduleSource, /spawnPipeline/);
  assert.match(moduleSource, /fromUtf8/);
  assert.match(moduleSource, /jayess_module_stdlib_jayess_json_index_js::parse/);
  assert.match(moduleSource, /jayess_module_stdlib_jayess_object_index_js::assign/);
  assert.match(runtimeHeader, /struct subprocess_state/);
  assert.match(runtimeHeader, /value subprocess_run_async\(const std::string& command, const value& args, const value& options\);/);
  assert.match(runtimeHeader, /value subprocess_stdout_stream\(const value& input\);/);
  assert.match(runtimeHeader, /value subprocess_stderr_stream\(const value& input\);/);
  assert.match(runtimeSource, /value subprocess_spawn\(const std::string& command, const value& args, const value& options\)/);
  assert.match(runtimeSource, /value subprocess_join\(const value& input\)/);
  assert.match(runtimeSource, /value subprocess_kill\(const value& input\)/);
  assert.match(runtimeSource, /value subprocess_stdout_stream\(const value& input\)/);
  assert.match(runtimeSource, /value subprocess_stderr_stream\(const value& input\)/);
  assert.match(runtimeSource, /stdinBytes/);
  assert.match(runtimeSource, /Jayess subprocess stdinBytes option must be bytes/);
  assert.match(runtimeSource, /"timedOut", state->timed_out/);
});
