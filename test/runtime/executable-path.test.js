import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function pathMain(targetDir, { header, namespace }) {
  const inputPath = JSON.stringify(`${targetDir}/nested/example.txt`);
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
  auto result = ${namespace}::inspectPath(std::vector<jayess::value>{std::string(${inputPath})});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 8, "path result length");
  require(std::get<std::string>(items[1]).size() > 0, "path dir");
  require(std::get<std::string>(items[2]) == "example.txt", "path base");
  require(std::get<std::string>(items[3]) == "example", "path name");
  require(std::get<std::string>(items[4]) == ".txt", "path ext");
  require(std::get<std::string>(items[5]).find("example.txt") != std::string::npos, "path format");
  require(std::get<std::string>(items[6]).size() == 1, "path separator");
  require(std::get<std::string>(items[7]).size() == 1, "path delimiter");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs path structure helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/path-structure-main.js", "runtime-path-structure-executable", pathMain);
});
