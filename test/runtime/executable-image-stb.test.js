import path from "node:path";
import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageStbMain(_targetDir, { header, namespace }) {
  const fixtureRoot = JSON.stringify(path.resolve("test/fixtures/modules").replace(/\\/g, "/"));
  return `#include <cmath>
#include <iostream>
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
  auto value = ${namespace}::stbImageSummary(std::vector<jayess::value>{std::string(${fixtureRoot})});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 2.0, "png width");
  require(std::get<double>(items[1]) == 2.0, "png height");
  require(std::get<double>(items[2]) == 255.0, "png red channel");
  require(std::get<double>(items[3]) == 0.0, "png green channel");
  require(std::get<double>(items[4]) == 255.0, "bmp blue channel through generic loader");
  require(std::get<double>(items[5]) == 2.0, "generic png width");
  require(std::get<double>(items[6]) == 2.0, "generic bmp height");
  require(std::get<double>(items[7]) == 2.0, "jpeg width");
  require(std::get<double>(items[8]) == 2.0, "jpeg height");
  require(std::get<double>(items[9]) == 2.0, "gif width");
  require(std::get<double>(items[10]) == 2.0, "gif height");
  require(std::get<double>(items[11]) > 0.0, "webp width");
  require(std::get<double>(items[12]) > 0.0, "webp height");
  require(std::get<double>(items[13]) == std::get<double>(items[11]), "packed webp width");
  require(std::get<double>(items[14]) == std::get<double>(items[12]), "packed webp height");
  require(std::get<double>(items[15]) == 255.0, "packed png transparent green");
  require(std::fabs(std::get<double>(items[16]) - 0.50196078) < 0.01, "packed png alpha");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ loads STB-backed image formats, WebP, and packed transparent PNGs", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-stb-main.js", "runtime-image-stb", imageStbMain);
});
