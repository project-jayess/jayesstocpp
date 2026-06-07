import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../../src/cpp/runtime-source.js";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function compileAndRun(targetDir, mainSource) {
  const runtimeDir = path.join(targetDir, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.hpp"), getRuntimeHeaderSource({ features: ["subprocess"] }), "utf8");
  fs.writeFileSync(path.join(runtimeDir, "jayess_runtime.cpp"), getRuntimeCppSource({ features: ["subprocess"] }), "utf8");
  compileAndRunCppExecutable([path.join(runtimeDir, "jayess_runtime.cpp")], targetDir, mainSource, "subprocess-runtime-test");
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

jayess::value shell_args(std::string script) {
#ifdef _WIN32
  return jayess::make_array({std::string("/c"), std::move(script)});
#else
  return jayess::make_array({std::string("-c"), std::move(script)});
#endif
}

std::string shell_command() {
#ifdef _WIN32
  return "cmd";
#else
  return "sh";
#endif
}

std::string print_script(std::string text) {
#ifdef _WIN32
  return "<nul set /p dummy=" + text;
#else
  return "printf " + text;
#endif
}

std::string fail_script() {
#ifdef _WIN32
  return "exit /b 7";
#else
  return "exit 7";
#endif
}

std::string sleep_script() {
#ifdef _WIN32
  return "ping -n 3 127.0.0.1 > nul";
#else
  return "sleep 2";
#endif
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
#ifdef _WIN32
  bool rejected_unavailable = false;
  try {
    jayess::subprocess_spawn(shell_command(), shell_args(print_script("run-ok")), empty_options());
  } catch (const std::exception& error) {
    rejected_unavailable = std::string(error.what()).find("not available") != std::string::npos;
  }
  assert(rejected_unavailable);
  return 0;
#else
  auto completed = jayess::await_sync(jayess::subprocess_run_async(shell_command(), shell_args(print_script("run-ok")), empty_options()));
  assert(string_field(completed, "stdout") == "run-ok");
  assert(number_field(completed, "exitCode") == 0.0);

  auto failed = jayess::await_sync(jayess::subprocess_run_async(shell_command(), shell_args(fail_script()), empty_options()));
  assert(number_field(failed, "exitCode") == 7.0);

  auto handle = jayess::subprocess_spawn(shell_command(), shell_args(print_script("spawned")), empty_options());
  auto joined = jayess::subprocess_join(handle);
  assert(string_field(joined, "stdout") == "spawned");

  auto sleep_handle = jayess::subprocess_spawn(shell_command(), shell_args(sleep_script()), empty_options());
  jayess::subprocess_kill(sleep_handle);
  auto killed = jayess::subprocess_join(sleep_handle);
  assert(bool_field(killed, "killed"));

  bool rejected_invalid_args = false;
  try {
    jayess::subprocess_spawn(shell_command(), jayess::value(1.0), empty_options());
  } catch (const std::exception&) {
    rejected_invalid_args = true;
  }
  assert(rejected_invalid_args);
  return 0;
#endif
}
`);
  assert.ok(true);
});
