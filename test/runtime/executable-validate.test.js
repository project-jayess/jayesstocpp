import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function validateMain({ header, namespace }) {
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
  require(std::get<bool>(items[0]) == true, "valid ok");
  require(std::get<bool>(items[1]) == false, "invalid ok");
  require(std::get<double>(items[2]) == 5.0, "invalid error count");
  require(std::get<std::string>(items[3]) == "Jayess", "asserted value");
  try {
    ${namespace}::invalidAssert(std::vector<jayess::value>{});
    throw std::runtime_error("expected validate assert diagnostic");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(error.value).find("jayess:validate") != std::string::npos, "validate diagnostic");
  }
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs validate standard-library helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/validate-main.js", "runtime-validate-stdlib", (_targetDir, entry) => validateMain(entry));
});
