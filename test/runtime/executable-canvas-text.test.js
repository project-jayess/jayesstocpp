import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasTextMain(targetDir, { header, namespace }) {
  return `#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string readFile(const std::string& path) {
  std::ifstream input(path, std::ios::binary);
  return std::string(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
}

int main() {
  const std::string ppmPath = "${targetDir}/canvas-text.ppm";
  ${namespace}::jayess_module_init();
  auto rendered = ${namespace}::renderTextBox(std::vector<jayess::value>{ppmPath});
  require(std::get<bool>(rendered) == true, "canvas text render");
  auto ppm = readFile(ppmPath);
  require(ppm.find("P3\\n48 24\\n255\\n") == 0, "canvas text ppm header");
  require(ppm.find("255 255 255") != std::string::npos, "canvas text has white pixels");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ renders a canvas text box to a deterministic image file", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-text-main.js", "runtime-canvas-text", canvasTextMain);
});
