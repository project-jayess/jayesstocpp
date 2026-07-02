import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function primitiveMain(_targetDir, { header, namespace }) {
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
  auto value = ${namespace}::render(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 10.0, "drawPixel");
  require(std::get<double>(items[1]) == 20.0, "drawLine");
  require(std::get<double>(items[2]) == 30.0, "drawRect");
  require(std::get<double>(items[3]) == 40.0, "fillRect");
  require(std::get<double>(items[4]) == 50.0, "drawEllipse");
  require(std::get<double>(items[5]) == 60.0, "fillEllipse");
  require(std::get<double>(items[6]) == 70.0, "drawTriangle");
  require(std::get<double>(items[7]) == 80.0, "fillTriangle");
  require(std::get<double>(items[8]) == 90.0, "drawCapsule");
  require(std::get<double>(items[9]) == 100.0, "fillCapsule");
  require(std::get<double>(items[10]) == 110.0, "drawPolyline");
  require(std::get<double>(items[11]) == 120.0, "drawPolygon");
  require(std::get<double>(items[12]) == 130.0, "fillPolygon");
  require(std::get<double>(items[13]) == 140.0, "fillSemiellipse");
  require(std::get<double>(items[14]) == 150.0, "drawSemiellipse");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs explicit canvas primitive API helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-primitive-api-main.js", "runtime-canvas-primitive-api", primitiveMain);
});
