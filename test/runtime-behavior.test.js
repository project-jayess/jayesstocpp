import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../src/api/transpile-file.js";
import { createManagedTempDir } from "./support/temp-dir.js";

function readRuntimeSource(targetDir) {
  return fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
}

function readDependencyPlan(targetDir) {
  return JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
}

function transpileFixture(t, name) {
  const targetDir = createManagedTempDir(t, `${name.replaceAll("/", "-")}-runtime-behavior`);
  transpileFile(path.resolve("test/fixtures/modules", name), targetDir);
  return targetDir;
}

test("runtime behavior wiring keeps jayess:fs defaults scheduler-backed", (t) => {
  const targetDir = transpileFixture(t, "fs-async-main.js");
  const runtime = readRuntimeSource(targetDir);

  assert.match(runtime, /value fs_async_result\(std::function<value\(\)> operation\)/);
  assert.match(runtime, /auto result = make_pending_async\(\);/);
  assert.match(runtime, /async_schedule\(\[result, operation = std::move\(operation\)\]\(\) mutable \{/);
});

test("runtime behavior wiring includes thread spawn and join helpers", (t) => {
  const targetDir = transpileFixture(t, "thread-main.js");
  const runtime = readRuntimeSource(targetDir);

  assert.match(runtime, /value thread_spawn\(const value& callback, const value& args\)/);
  assert.match(runtime, /value thread_join\(const value& input\)/);
});

test("runtime behavior wiring includes async timeout and rejection composition", (t) => {
  const targetDir = transpileFixture(t, "async-rejection-main.js");
  const runtime = readRuntimeSource(targetDir);

  assert.match(runtime, /value make_rejected_async\(value rejected\)/);
  assert.match(runtime, /value async_timeout\(const value& handle, const value& milliseconds\)/);
  assert.match(runtime, /value async_catch_error\(const value& handle, const value& callback\)/);
  assert.match(runtime, /value async_finally_do\(const value& handle, const value& callback\)/);
});

test("runtime behavior wiring preserves binary flow through bytes, encoding, and crypto modules", (t) => {
  const targetDir = transpileFixture(t, "crypto-main.js");
  const plan = readDependencyPlan(targetDir);
  const entry = plan.modules.find((moduleRecord) => moduleRecord.sourceFilename.endsWith("crypto-main.js"));

  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => dependency.source),
    ["jayess:bytes", "jayess:encoding", "jayess:crypto"]
  );
});
