import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasStateMain(targetDir, { header, namespace }) {
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
    const std::string ppmPath = ${JSON.stringify(`${targetDir.replace(/\\/g, "/")}/canvas-state-scene.ppm`)};
    const std::string expected =
      "P3\\n"
      "5 5\\n"
      "255\\n"
      "255 0 0\\n0 0 0\\n0 255 0\\n0 0 0\\n0 0 0\\n"
      "0 0 0\\n255 0 0\\n0 0 0\\n0 0 0\\n0 0 0\\n"
      "0 0 0\\n0 0 0\\n255 255 0\\n0 0 0\\n255 255 0\\n"
      "0 0 0\\n0 0 0\\n0 0 0\\n0 0 0\\n0 0 0\\n"
      "255 255 255\\n0 0 0\\n0 0 0\\n0 0 0\\n0 0 0\\n";
    ${namespace}::jayess_module_init();
    auto rendered = ${namespace}::renderStateScene(std::vector<jayess::value>{ppmPath});
    require(std::get<bool>(rendered) == true, "canvas state scene render");
    require(readFile(ppmPath) == expected, "canvas state ppm content");

    bool restoreFailed = false;
    try {
      ${namespace}::invalidRestore(std::vector<jayess::value>{});
    } catch (const jayess::thrown_value& error) {
      auto payload = jayess::exception_to_value(error);
      restoreFailed = std::holds_alternative<std::string>(payload)
        && std::get<std::string>(payload).find("restoreState requires a saved state") != std::string::npos;
    }
    require(restoreFailed, "restoreState empty-stack diagnostic");

    bool scaleFailed = false;
    try {
      ${namespace}::invalidScale(std::vector<jayess::value>{});
    } catch (const jayess::thrown_value& error) {
      auto payload = jayess::exception_to_value(error);
      scaleFailed = std::holds_alternative<std::string>(payload)
        && std::get<std::string>(payload).find("scale values must be non-zero") != std::string::npos;
    }
    require(scaleFailed, "scale zero diagnostic");

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

runtimeTest("generated C++ renders deterministic canvas drawing-state scene and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-state-main.js", "runtime-canvas-state", canvasStateMain);
});
