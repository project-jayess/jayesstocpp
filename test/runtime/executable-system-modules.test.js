import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function systemMain(targetDir, { header, namespace }) {
  const expectedCwd = JSON.stringify(targetDir.replace(/\\/g, "/"));
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
  jayess::process_set_argv({"jayess", "host-check"});
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{std::string(${JSON.stringify(targetDir)})});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 9, "system host result length");
  require(std::get<std::string>(items[0]) == "Jayess", "fs read after rename");
  require(std::get<std::string>(items[1]) == std::string(${expectedCwd}), "process cwd");
  require(std::get<double>(items[2]) == 2.0, "process argv length");
  require(std::get<double>(items[3]) == 1.0, "fs list count");
  require(std::get<bool>(items[4]) == true, "fs stat before rename");
  require(std::get<bool>(items[5]) == true, "fs stat after rename");
  require(std::get<std::string>(items[6]) == "jayess.txt", "path relative");
  require(std::get<bool>(items[7]) == true, "path isAbsolute");
  require(std::get<bool>(items[8]) == false, "fs remove cleanup");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs controlled jayess:fs, jayess:path, and jayess:process host behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/system-host-main.js", "runtime-system-host-executable", systemMain);
});
