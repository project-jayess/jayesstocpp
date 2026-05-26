import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function fsRecursiveMain(targetDir, { header, namespace }) {
  const root = JSON.stringify(`${targetDir}/fs-recursive`);
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
  auto result = ${namespace}::run(std::vector<jayess::value>{std::string(${root})});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 1.0, "walk result length");
  require(std::get<std::string>(items[1]) == "child.txt", "walk relative path");
  require(std::get<std::string>(items[2]) == "file", "walk entry type");
  require(std::get<std::string>(items[3]) == "recursive", "copyRecursive copied text");
  require(std::get<double>(items[4]) >= 2.0, "removeRecursive removed tree entries");
  require(std::get<bool>(items[5]) == false, "removeRecursive removed source");

  try {
    ${namespace}::copyIntoSource(std::vector<jayess::value>{std::string(${root})});
    throw std::runtime_error("copyRecursive target inside source accepted");
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()).find("target cannot be inside source tree") != std::string::npos, "copyRecursive inside-source diagnostic");
  }

  try {
    ${namespace}::walkWithUnsupportedOptions(std::vector<jayess::value>{std::string(${root})});
    throw std::runtime_error("walk unsupported option accepted");
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()).find("option is unsupported") != std::string::npos, "walk unsupported option diagnostic");
  }

  try {
    ${namespace}::walkEmptyPath(std::vector<jayess::value>{});
    throw std::runtime_error("walk empty path accepted");
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()).find("non-empty path") != std::string::npos, "walk empty path diagnostic");
  }

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs recursive filesystem helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/fs-recursive-main.js", "runtime-fs-recursive-executable", fsRecursiveMain);
});
