import test from "node:test";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

runtimeTest("generated runtime reports normalized user-visible diagnostics", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-normalized-diagnostics");
  const runtimeCppPath = writeRuntime(targetDir);
  const main = `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
#include "runtime/jayess_runtime.hpp"

void requireMessage(const std::string& actual, const std::string& expected) {
  if (actual != expected) {
    throw std::runtime_error("expected '" + expected + "' but got '" + actual + "'");
  }
}

template <typename Fn>
void requireRuntimeError(Fn fn, const std::string& expected) {
  try {
    fn();
  } catch (const std::runtime_error& error) {
    requireMessage(error.what(), expected);
    return;
  }
  throw std::runtime_error("expected runtime_error");
}

int main() {
  requireRuntimeError([]() {
    jayess::add(jayess::value(1.0), jayess::value(std::string("x")));
  }, "Jayess add operands are unsupported");

  requireRuntimeError([]() {
    jayess::array_pop(jayess::value(std::monostate{}));
  }, "Jayess array pop requires array receiver");

  requireRuntimeError([]() {
    jayess::string_slice(jayess::value(std::monostate{}), {jayess::value(0.0)});
  }, "Jayess string slice requires a string receiver");

  requireRuntimeError([]() {
    jayess::map_get(jayess::value(std::monostate{}), jayess::value(std::string("key")));
  }, "Jayess map operation requires map receiver");

  requireRuntimeError([]() {
    std::vector<jayess::value> args;
    jayess::append_spread_values(args, jayess::value(std::monostate{}));
  }, "Jayess argument spread requires an array source");

  requireRuntimeError([]() {
    jayess::destructure_rest_array(jayess::value(std::monostate{}), 0);
  }, "Jayess array rest destructuring requires an array source");

  requireRuntimeError([]() {
    jayess::throw_unsupported_option("subprocess", "shell");
  }, "Jayess subprocess option is unsupported: shell");

  requireRuntimeError([]() {
    auto bytes = jayess::bytes_from_array(jayess::make_array({jayess::value(65.0)}));
    static_cast<void>(jayess::stringify_value(bytes));
  }, "Jayess string conversion does not support bytes values");

  std::cout << "ok\\n";
  return 0;
}
`;

  compileAndRunCppExecutable([runtimeCppPath], path.dirname(runtimeCppPath), main);
});
