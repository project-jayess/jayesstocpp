import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function mediaFontMain(targetDir, { header, namespace }) {
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
  auto result = ${namespace}::inspectMediaFontBreakpoint(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 3.0, "media rule count");
  require(std::get<double>(items[1]) == 120.0, "wide width");
  require(std::get<double>(items[2]) == 20.0, "wide font size");
  require(std::get<double>(items[3]) == 32.0, "wide line height");
  require(std::get<double>(items[4]) == 40.0, "narrow width");
  require(std::get<double>(items[5]) == 12.0, "narrow font size");
  require(std::get<double>(items[6]) == 16.0, "narrow line height");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ applies canvas HTML media font breakpoints", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/canvas-html-media-font-main.js", "runtime-canvas-html-media-font", mediaFontMain);
});
