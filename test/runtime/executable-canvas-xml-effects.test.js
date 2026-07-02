import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function xmlEffectsMain(_targetDir, { header, namespace }) {
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
  auto value = ${namespace}::renderEffectsSummary(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 255.0, "higher z rectangle");
  require(std::get<double>(items[1]) == 34.0, "shape fill");
  require(std::get<double>(items[2]) == 51.0, "shape shadow");
  require(std::get<double>(items[3]) == 68.0, "text fill");
  require(std::get<double>(items[4]) > 0.0, "text shadow");
  require(std::get<double>(items[5]) == 85.0, "pixel fill");
  require(std::get<double>(items[6]) == 51.0, "pixel shadow");
  require(std::get<double>(items[7]) > 100.0 && std::get<double>(items[7]) < 160.0, "alpha pixel blends");
  require(std::get<double>(items[8]) == 68.0, "spread shadow");
  require(std::get<double>(items[9]) > 0.0, "blur shadow");
  require(std::get<double>(items[10]) > 0.0 && std::get<double>(items[10]) < std::get<double>(items[9]), "blur tail fades");
  require(std::get<double>(items[11]) > 100.0 && std::get<double>(items[11]) < 160.0, "outline opacity blends");

  auto antialiasValue = ${namespace}::renderAntialiasSummary(std::vector<jayess::value>{});
  const auto& antialiasItems = std::get<jayess::array_ptr>(antialiasValue)->items;
  require(std::get<double>(antialiasItems[1]) > 0.0, "antialias blends edge");
  require(std::get<double>(antialiasItems[1]) < 255.0, "antialias edge is partial");
  require(std::get<double>(antialiasItems[2]) == 255.0, "antialias preserves interior");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ renders canvas XML z ordering and shadows", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-xml-effects-main.js", "runtime-canvas-xml-effects", xmlEffectsMain);
});
