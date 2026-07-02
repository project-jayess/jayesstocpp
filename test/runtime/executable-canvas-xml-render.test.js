import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function xmlRenderMain(_targetDir, { header, namespace }) {
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
  auto value = ${namespace}::renderSummary(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 17.0, "rectangle");
  require(std::get<double>(items[1]) == 17.0, "line");
  require(std::get<double>(items[2]) == 51.0, "pixel");
  require(std::get<double>(items[3]) == 68.0, "ellipse");
  require(std::get<double>(items[4]) == 85.0, "semiellipse");
  require(std::get<double>(items[5]) == 102.0, "triangle");
  require(std::get<double>(items[6]) == 119.0, "polygon");
  require(std::get<double>(items[7]) == 68.0, "polyline");
  require(std::get<double>(items[8]) == 153.0, "capsule");
  require(std::get<double>(items[9]) == 170.0, "text");
  require(std::get<double>(items[10]) == 187.0, "rectangle points");
  require(std::get<double>(items[11]) == 204.0, "ellipse points");
  require(std::get<double>(items[12]) == 221.0, "semiellipse points");
  require(std::get<double>(items[13]) == 238.0, "capsule points");
  auto imageValue = ${namespace}::renderImageSummary(std::vector<jayess::value>{});
  const auto& imageItems = std::get<jayess::array_ptr>(imageValue)->items;
  require(std::get<double>(imageItems[0]) == 12.0, "image top-left");
  require(std::get<double>(imageItems[1]) == 34.0, "image bottom-right");
  auto labelValue = ${namespace}::renderLabelSummary(std::vector<jayess::value>{});
  require(std::get<double>(labelValue) > 0.0, "inner shape label pixels");
  require(thrown_message(${namespace}::invalidNetworkImage).find("network sources must be fetched") != std::string::npos, "network image diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ renders canvas XML scene shapes", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-xml-render-main.js", "runtime-canvas-xml-render", xmlRenderMain);
});
