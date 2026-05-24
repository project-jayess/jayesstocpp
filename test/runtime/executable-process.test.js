import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function processMain({ header, namespace }) {
  return `#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

int main() {
  setenv("JAYESS_PROCESS_TEST", "visible", 1);
  jayess::process_set_argv({"jayess", "one"});
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspectEnv(std::vector<jayess::value>{std::string("JAYESS_PROCESS_TEST")});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<bool>(items[0]) == true, "has env");
  require(std::get<std::string>(items[1]) == "visible", "env value");
  require(std::get<double>(items[2]) >= 1.0, "env key count");
  require(std::get<double>(items[3]) >= 1.0, "env entry count");
  require(std::get<double>(items[4]) >= 1.0, "cwd length");
  require(std::get<double>(items[5]) == 2.0, "argv length");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs process environment inspection helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/process-main.js", "runtime-process-executable", (_targetDir, entry) => processMain(entry));
});
