import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasMain(targetDir, { header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  const std::string ppmPath = "${targetDir}/canvas-output.ppm";
  ${namespace}::jayess_module_init();
  auto title = ${namespace}::run(std::vector<jayess::value>{ppmPath});
  require(std::get<std::string>(title) == "fixture", "canvas title");

  const auto ppm = readFile(ppmPath);
  const std::string expected =
    "P3\\n4 4\\n255\\n"
    "0 255 0\\n0 255 0\\n0 255 0\\n0 0 255\\n"
    "0 255 0\\n255 0 0\\n0 0 255\\n0 255 0\\n"
    "0 255 0\\n0 0 255\\n255 0 0\\n0 255 0\\n"
    "0 0 255\\n0 255 0\\n0 255 0\\n0 255 0\\n";
  require(ppm == expected, "canvas ppm content");

  auto details = ${namespace}::inspect(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(details)->items;
  require(std::get<double>(items[0]) == 6.0, "canvas width helper");
  require(std::get<double>(items[1]) == 6.0, "canvas height helper");
  require(std::get<double>(items[2]) == 255.0, "fillCircle red pixel");
  require(std::get<double>(items[3]) == 0.0, "fillCircle green channel");
  require(std::get<double>(items[4]) == 255.0, "strokeCircle green pixel");
  require(std::get<double>(items[5]) == 255.0, "polyline blue pixel");
  require(std::get<double>(items[6]) == 80.0, "drawImage copied pixel");
  require(std::get<double>(items[7]) == 255.0, "drawCanvas clipped pixel");
  require(std::get<std::string>(items[8]) == "inspect", "canvas copy title");
  require(std::get<double>(items[9]) == 3.0, "clip width");
  require(std::get<double>(items[10]) == 80.0, "drawImageClipped pixel");
  require(std::get<double>(items[11]) == 33.0, "fillPolygon pixel");
  require(std::get<double>(items[12]) == 77.0, "strokePolygon pixel");
  require(std::get<double>(items[13]) == 67.0, "alpha blend pixel");
  require(std::get<double>(items[14]) == 2.0, "image metadata width");
  require(std::get<double>(items[15]) == 2.0, "image metadata height");
  require(std::get<double>(items[16]) == 120.0, "fillEllipse pixel");
  require(std::get<double>(items[17]) == 130.0, "strokeEllipse pixel");
  require(std::get<double>(items[18]) == 140.0, "quadraticCurve pixel");
  require(std::get<double>(items[19]) == 150.0, "bezierCurve pixel");
  require(std::get<double>(items[20]) == 160.0, "canvas text pixel");
  require(std::get<double>(items[21]) == 7.0, "canvas measureText width");
  require(std::get<double>(items[22]) == 3.0, "canvas measureText height");

  auto pointError = thrown_message(${namespace}::invalidPoint);
  require(pointError.find("point with x and y") != std::string::npos, "invalid point diagnostic");
  auto radiusError = thrown_message(${namespace}::invalidRadius);
  require(radiusError.find("radius must be non-negative") != std::string::npos, "invalid radius diagnostic");
  auto ellipseRadiusError = thrown_message(${namespace}::invalidEllipseRadius);
  require(ellipseRadiusError.find("ellipse radius must be non-negative") != std::string::npos, "invalid ellipse radius diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs canvas drawing over image buffers and writes PPM output", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-main.js", "runtime-canvas-stdlib", canvasMain);
});
