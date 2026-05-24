import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function guiMain({ header, namespace }) {
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

  auto interaction = ${namespace}::runRuntimeScenario(std::vector<jayess::value>{});
  const auto& interactionItems = std::get<jayess::array_ptr>(interaction)->items;
  require(std::get<bool>(interactionItems[0]) == true, "column layout places button below label");
  require(std::get<bool>(interactionItems[1]) == true, "hover dispatch marks button hovered");
  require(std::get<double>(interactionItems[2]) == 1.0, "click dispatch queues one toolkit action");
  require(std::get<std::string>(interactionItems[3]) == "run", "drained toolkit action identifies the clicked button");
  require(std::get<bool>(interactionItems[4]) == true, "state change invalidates redraw before draw");
  require(std::get<bool>(interactionItems[5]) == false, "draw clears pending redraw flag");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:gui layout, hover/click dispatch, and redraw behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gui-runtime-main.js", "runtime-gui", (_targetDir, entry) => guiMain(entry));
});
