import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function packedAssetMain(_targetDir, { header, namespace }) {
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

double color_channel(const jayess::value& input, const std::string& key) {
  return std::get<double>(std::get<jayess::object_ptr>(input)->fields.at(key));
}

int main() {
  ${namespace}::jayess_module_init();
  auto value = ${namespace}::packedAssets(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<std::string>(items[0]).find("<scene") != std::string::npos, "packed xml scene");
  require(std::get<std::string>(items[0]).find("width=\\"4\\"") != std::string::npos, "packed xml width");
  require(color_channel(items[1], "red") == 255.0, "packed image red");
  require(color_channel(items[1], "green") == 0.0, "packed image green");
  require(color_channel(items[2], "red") == 255.0, "packed scene red");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ reads packed canvas XML and image assets", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-pack-main.js", "runtime-canvas-pack", packedAssetMain);
});
