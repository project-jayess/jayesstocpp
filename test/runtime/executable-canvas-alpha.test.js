import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasAlphaMain(targetDir, { header, namespace }) {
  void targetDir;
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
  require(std::get<double>(items[0]) == 60.0, "fillRect alpha composite");
  require(std::get<double>(items[1]) == 40.0, "drawImage alpha composite");
  require(std::get<double>(items[2]) == 40.0, "drawImageClipped alpha composite");
  require(std::get<double>(items[3]) == 50.0, "line alpha composite");
  require(std::get<double>(items[4]) == 30.0, "fill helper alpha composite");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs canvas alpha compositing consistently across rectangles, image blits, and fill/stroke helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-alpha-main.js", "runtime-canvas-alpha", canvasAlphaMain);
});
