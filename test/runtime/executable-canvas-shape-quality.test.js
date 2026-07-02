import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function shapeQualityMain(_targetDir, { header, namespace }) {
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
  auto value = ${namespace}::shapeQuality(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 10.0, "ellipse top row adjacent pixel");
  require(std::get<double>(items[1]) == 10.0, "ellipse top row center pixel");
  require(std::get<double>(items[2]) == 20.0, "filled ellipse top row adjacent pixel");
  require(std::get<double>(items[3]) == 20.0, "filled ellipse top row center pixel");
  require(std::get<double>(items[4]) == 0.0, "capsule outline omits rectangular corner");
  require(std::get<double>(items[5]) == 30.0, "capsule outline top curve");
  require(std::get<double>(items[6]) == 30.0, "capsule outline side curve");
  require(std::get<double>(items[7]) == 0.0, "capsule outline hollow center");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ draws smooth ellipse extrema and capsule outlines", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-shape-quality-main.js", "runtime-canvas-shape-quality", shapeQualityMain);
});
