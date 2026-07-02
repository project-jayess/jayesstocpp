import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function runtimeUpdateMain(_targetDir, { header, namespace }) {
  return `#include <iostream>
#include <stdexcept>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

int main() {
  ${namespace}::jayess_module_init();
  auto value = ${namespace}::updateSummary(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 255.0, "initial blue fill");
  require(std::get<double>(items[1]) == 1.0, "hit topmost target");
  require(std::get<double>(items[2]) == 2.0, "hit elements count");
  require(std::get<double>(items[3]) == 1.0, "hit elements topmost first");
  require(std::get<double>(items[4]) == 1.0, "hit elements includes lower target");
  require(std::get<double>(items[5]) == 1.0, "ellipse corner is outside hit area");
  require(std::get<double>(items[6]) == 0.0, "ellipse corner returns no hits");
  require(std::get<double>(items[7]) == 255.0, "mouseover redraw");
  require(std::get<double>(items[8]) == 1.0, "mouseover event count");
  require(std::get<double>(items[9]) == 1.0, "mouseover event type");
  require(std::get<double>(items[10]) == 255.0, "mouseout redraw");
  require(std::get<double>(items[11]) == 1.0, "mouseout event count");
  require(std::get<double>(items[12]) == 1.0, "mouseout event type");
  require(std::get<double>(items[13]) == 1.0, "runtime xy mutation moves element");
  require(std::get<double>(items[14]) == 1.0, "runtime w/h mutation resizes element");
  require(std::get<double>(items[15]) > 100.0 && std::get<double>(items[15]) < 160.0, "runtime outline opacity blends");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ mutates canvas XML scene attributes at runtime", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-runtime-update-main.js", "runtime-canvas-runtime-update", runtimeUpdateMain);
});
