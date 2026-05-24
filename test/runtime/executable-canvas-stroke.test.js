import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasStrokeMain(targetDir, { header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 30.0, "wide line left pixel");
  require(std::get<double>(items[1]) == 40.0, "wide line right pixel");
  require(std::get<double>(items[2]) == 30.0, "wide strokeRect pixel");
  require(std::get<double>(items[3]) == 30.0, "wide quadraticCurve pixel");
  require(std::get<double>(items[4]) == 40.0, "wide strokePolygon pixel");

  auto strokeWidthError = thrown_message(${namespace}::invalidStrokeWidth);
  require(strokeWidthError.find("strokeWidth") != std::string::npos, "invalid strokeWidth diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs canvas strokeWidth helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-stroke-main.js", "runtime-canvas-stroke", canvasStrokeMain);
});
