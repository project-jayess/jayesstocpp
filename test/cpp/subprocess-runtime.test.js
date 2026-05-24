import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../../src/cpp/runtime-source.js";
import { findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function compileAndRun(targetDir, mainSource) {
  const compiler = findAvailableCompiler();
  const runtimeDir = path.join(targetDir, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.hpp"), getRuntimeHeaderSource({ features: ["subprocess"] }), "utf8");
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.cpp"), getRuntimeCppSource({ features: ["subprocess"] }), "utf8");
  fs.writeFileSync(path.join(targetDir, "main.cpp"), mainSource, "utf8");

  const executable = path.join(targetDir, "subprocess-runtime-test");
  execFileSync(compiler, [
    "-std=c++17",
    path.join(runtimeDir, "jayess_runtime.cpp"),
    path.join(targetDir, "main.cpp"),
    "-I",
    targetDir,
    "-pthread",
    "-o",
    executable
  ], { cwd: targetDir, stdio: "pipe", encoding: "utf8" });
  execFileSync(executable, [], { cwd: targetDir, stdio: "pipe", encoding: "utf8" });
}

runtimeTest("subprocess runtime captures completion data and validates arguments", (t) => {
  const targetDir = createManagedTempDir(t, "subprocess-runtime");
  compileAndRun(targetDir, String.raw`
#include "runtime/jayess_runtime.hpp"
#include <cassert>
#include <string>

jayess::value empty_options() {
  return jayess::make_object({});
}

jayess::value command_args(std::string script) {
  return jayess::make_array({std::string("-c"), std::move(script)});
}

const jayess::object_ptr& as_object(const jayess::value& input) {
  return std::get<jayess::object_ptr>(input);
}

std::string string_field(const jayess::value& input, const std::string& key) {
  return std::get<std::string>(as_object(input)->fields.at(key));
}

double number_field(const jayess::value& input, const std::string& key) {
  return std::get<double>(as_object(input)->fields.at(key));
}

bool bool_field(const jayess::value& input, const std::string& key) {
  return std::get<bool>(as_object(input)->fields.at(key));
}

int main() {
  auto completed = jayess::await_sync(jayess::subprocess_run_async("sh", command_args("printf run-ok"), empty_options()));
  assert(string_field(completed, "stdout") == "run-ok");
  assert(number_field(completed, "exitCode") == 0.0);

  auto failed = jayess::await_sync(jayess::subprocess_run_async("sh", command_args("exit 7"), empty_options()));
  assert(number_field(failed, "exitCode") == 7.0);

  auto handle = jayess::subprocess_spawn("sh", command_args("printf spawned"), empty_options());
  auto joined = jayess::subprocess_join(handle);
  assert(string_field(joined, "stdout") == "spawned");

  auto sleep_handle = jayess::subprocess_spawn("sh", command_args("sleep 2"), empty_options());
  jayess::subprocess_kill(sleep_handle);
  auto killed = jayess::subprocess_join(sleep_handle);
  assert(bool_field(killed, "killed"));

  bool rejected_invalid_args = false;
  try {
    jayess::subprocess_spawn("sh", jayess::value(1.0), empty_options());
  } catch (const std::exception&) {
    rejected_invalid_args = true;
  }
  assert(rejected_invalid_args);
  return 0;
}
`);
  assert.ok(true);
});
