import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function lifetimeMain({ header, namespace }) {
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

int main() {
  ${namespace}::jayess_module_init();
  auto result = jayess::await_sync(${namespace}::run(std::vector<jayess::value>{}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess", "escaping closure capture");
  require(std::get<std::string>(items[1]) == "async", "escaping async capture");
  require(std::get<double>(items[2]) == 4.0, "generator retained local");
  require(std::get<double>(items[3]) == 5.0, "generator completion local");
  require(std::get<std::string>(items[4]) == "class", "class field retained local");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ preserves representative escaping lifetime values", (t) => {
  transpileAndRunFixture(
    t,
    "test/fixtures/runtime/lifetime-escape-main.js",
    "runtime-lifetime-escape",
    (_targetDir, entry) => lifetimeMain(entry)
  );
});
