import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function generatorMain({ header, namespace }) {
  return `#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    if (std::holds_alternative<std::string>(error.payload)) {
      return std::get<std::string>(error.payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto first = ${namespace}::firstValue(std::vector<jayess::value>{});
  require(std::get<std::string>(first) == "ready", "generator first yield");
  auto failure = thrown_message(${namespace}::failureValue);
  require(failure == "boom", "generator thrown payload");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ preserves generator failure propagation across jayess:iter.next", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/generator-failure-main.js", "runtime-generator-failure-executable", (_targetDir, entry) => generatorMain(entry));
});
