import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function bytesMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess", "concat text");
  require(std::get<std::string>(items[1]) == "aye", "slice text");
  require(std::get<double>(items[2]) == 6.0, "length");
  require(std::get<bool>(items[3]) == true, "equals");
  require(std::get<bool>(items[4]) == true, "isBytes");
  require(std::get<double>(items[5]) == 3.0, "array length");
  require(std::get<double>(items[6]) == 97.0, "before fill");
  require(std::get<double>(items[7]) == 90.0, "after fill");
  require(std::get<double>(items[8]) == -1.0, "compare");
  require(std::get<bool>(items[9]) == true, "secureEquals same");
  require(std::get<bool>(items[10]) == false, "secureEquals different content");
  require(std::get<bool>(items[11]) == false, "secureEquals different length");
  require(std::get<bool>(items[12]) == true, "startsWith");
  require(std::get<bool>(items[13]) == true, "endsWith");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs bytes helpers including secureEquals", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/bytes-main.js", "runtime-bytes", (_targetDir, entry) => bytesMain(entry));
});
