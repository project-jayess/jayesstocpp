import test from "node:test";
import path from "node:path";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasGoldenMain(targetDir, { header, namespace }) {
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
  try {
    const std::string ppmPath = ${JSON.stringify(`${targetDir.replace(/\\/g, "/")}/canvas-golden-scene.ppm`)};
    const std::string expectedPath = ${JSON.stringify(path.resolve("test/fixtures/runtime/canvas-golden-scene.ppm").replace(/\\/g, "/"))};
    ${namespace}::jayess_module_init();
    auto rendered = ${namespace}::renderScene(std::vector<jayess::value>{ppmPath});
    require(std::get<bool>(rendered) == true, "canvas golden scene render");
    require(readFile(ppmPath) == readFile(expectedPath), "canvas golden scene ppm content");
    std::cout << "ok\\n";
    return 0;
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      std::cerr << std::get<std::string>(payload) << "\\n";
    }
    return 2;
  } catch (const std::exception& error) {
    std::cerr << error.what() << "\\n";
    return 3;
  }
}
`;
}

runtimeTest("generated C++ renders a deterministic canvas golden scene for clipping, overlap, alpha, curves, and polygons", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-golden-main.js", "runtime-canvas-golden", canvasGoldenMain);
});
