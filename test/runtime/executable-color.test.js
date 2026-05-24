import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function colorMain({ header, namespace }) {
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
  require(std::get<std::string>(items[0]) == "#ff0000", "rgb toHex");
  require(std::get<double>(items[1]) == 0.0, "short hex red");
  require(std::get<double>(items[2]) == 255.0, "short hex green");
  require(std::get<double>(items[3]) == 136.0, "short hex blue");
  require(std::get<std::string>(items[4]) == "#336699", "long hex toHex");
  require(std::get<std::string>(items[5]) == "#0c2238", "functional rgb toHex");
  require(std::get<double>(items[6]) == 0.5, "functional rgba alpha");
  require(std::get<double>(items[7]) == 0.25, "withAlpha alpha");
  require(std::get<std::string>(items[8]) == "#800080", "mix toHex");
  require(std::get<std::string>(items[9]) == "#808080", "lighten toHex");
  require(std::get<std::string>(items[10]) == "#808080", "darken toHex");
  require(std::get<double>(items[11]) == 0.75, "darken alpha");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs color construction, parsing, conversion, and blending", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/color-main.js", "runtime-color-stdlib", (_targetDir, entry) => colorMain(entry));
});
