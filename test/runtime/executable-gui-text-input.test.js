import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function guiTextInputMain({ header, namespace }) {
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

  auto interaction = ${namespace}::runTextInputScenario(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(interaction)->items;
  require(std::get<bool>(items[0]) == true, "text input focused");
  require(std::get<std::string>(items[1]) == "a", "text input edited value");
  require(std::get<double>(items[2]) == 1.0, "text input cursor after edit");
  require(std::get<double>(items[3]) == 5.0, "text input action count");
  require(std::get<std::string>(items[4]) == "input", "first action type");
  require(std::get<std::string>(items[5]) == "ab", "first input value");
  require(std::get<std::string>(items[6]) == "input", "second action type");
  require(std::get<std::string>(items[7]) == "a", "second input value");
  require(std::get<std::string>(items[8]) == "input", "third action type");
  require(std::get<std::string>(items[9]) == "ac", "third input value");
  require(std::get<double>(items[10]) == 1.0, "text input selection start");
  require(std::get<double>(items[11]) == 1.0, "text input selection end");
  require(std::get<std::string>(items[12]) == "textbox", "text input accessibility role");
  require(std::get<std::string>(items[13]) == "name", "text input accessibility label");
  require(std::get<bool>(items[14]) == true, "text input accessibility focused");
  require(std::get<std::string>(items[15]) == "ac", "text input accessibility value");
  require(std::get<bool>(items[16]) == true, "text input redraw requested");
  require(std::get<bool>(items[17]) == false, "text input draw clears redraw");
  require(std::get<bool>(items[18]) == true, "text input painted");

  auto blur = ${namespace}::runBlurScenario(std::vector<jayess::value>{});
  const auto& blurItems = std::get<jayess::array_ptr>(blur)->items;
  require(std::get<bool>(blurItems[0]) == false, "text input blurred");
  require(std::get<std::string>(blurItems[1]) == "x", "blur scenario value");
  require(std::get<double>(blurItems[2]) == 2.0, "blur action count");
  require(std::get<std::string>(blurItems[3]) == "input", "blur input action");
  require(std::get<std::string>(blurItems[4]) == "change", "blur change action");

  auto cursor = ${namespace}::runCursorScenario(std::vector<jayess::value>{});
  const auto& cursorItems = std::get<jayess::array_ptr>(cursor)->items;
  require(std::get<double>(cursorItems[0]) == 2.0, "cursor movement updates cursor");
  require(std::get<double>(cursorItems[1]) == 0.0, "cursor movement does not queue input action");
  require(std::get<bool>(cursorItems[2]) == true, "cursor movement requests redraw");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:gui text input focus, edit, actions, and redraw behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gui-text-input-main.js", "runtime-gui-text-input", (_targetDir, entry) => guiTextInputMain(entry));
});
