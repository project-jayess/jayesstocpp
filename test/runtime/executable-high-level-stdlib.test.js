import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function highLevelStdlibMain({ header, namespace }) {
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
  require(std::get<std::string>(items[0]) == "Jayess", "cli option");
  require(std::get<bool>(items[1]) == true, "cli flag");
  require(std::get<std::string>(items[2]) == "input.txt", "cli positional");
  require(std::get<bool>(items[3]) == true, "uuid shape");
  require(std::get<double>(items[4]) == 36.0, "uuid length");
  require(std::get<std::string>(items[5]) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "sha256 text");
  require(std::get<std::string>(items[6]) == "Jayess", "dotenv name");
  require(std::get<std::string>(items[7]) == "native", "dotenv mode");
  require(std::get<bool>(items[8]) == true, "dotenv stringify");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs high-level standard-library helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/high-level-stdlib-main.js", "runtime-high-level-stdlib", (_targetDir, entry) => highLevelStdlibMain(entry));
});
