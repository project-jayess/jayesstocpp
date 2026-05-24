import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function packageStdlibMain({ header, namespace }) {
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
  require(std::get<double>(items[0]) == 31.0, "package export");
  require(std::get<double>(items[1]) == 11.0, "package function");
  require(std::get<std::string>(items[2]) == "Jayess", "stdlib querystring");
  require(std::get<std::string>(items[3]) == "text/html", "stdlib mime");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs package imports together with standard-library modules", (t) => {
  transpileAndRunFixture(
    t,
    "test/fixtures/package-project/src/package-stdlib-runtime-main.js",
    "runtime-package-stdlib",
    (_targetDir, entry) => packageStdlibMain(entry)
  );
});
