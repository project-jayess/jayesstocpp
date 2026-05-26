import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function guiFormMain({ header, namespace }) {
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
  auto result = ${namespace}::runFormScenario(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<bool>(items[0]) == true, "checkbox checked");
  require(std::get<bool>(items[1]) == false, "first radio unchecked");
  require(std::get<bool>(items[2]) == true, "second radio checked");
  require(std::get<bool>(items[3]) == true, "form checkbox state");
  require(std::get<std::string>(items[4]) == "dark", "form radio state");
  require(std::get<std::string>(items[5]) == "Ada", "form text state");
  require(std::get<double>(items[6]) == 2.0, "form action count");
  require(std::get<std::string>(items[7]) == "change", "checkbox action type");
  require(std::get<std::string>(items[8]) == "accept", "checkbox action target");
  require(std::get<bool>(items[9]) == true, "checkbox action checked");
  require(std::get<std::string>(items[10]) == "change", "radio action type");
  require(std::get<std::string>(items[11]) == "dark", "radio action target");
  require(std::get<std::string>(items[12]) == "dark", "radio action value");
  require(std::get<std::string>(items[13]) == "accept", "tab focus traversal target");
  require(std::get<bool>(items[14]) == true, "form controls painted");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:gui checkbox, radio, form state, and focus traversal", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gui-form-main.js", "runtime-gui-form", (_targetDir, entry) => guiFormMain(entry));
});
