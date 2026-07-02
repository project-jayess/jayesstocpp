import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function xmlSceneMain(_targetDir, { header, namespace }) {
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
  auto value = ${namespace}::sceneSummary(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 120.0, "scene width");
  require(std::get<double>(items[1]) == 80.0, "scene height");
  require(std::get<double>(items[2]) == 17.0, "background red");
  require(std::get<double>(items[3]) == 34.0, "background green");
  require(std::get<double>(items[4]) == 51.0, "background blue");
  require(std::get<std::string>(items[5]) == "Shapes", "title");
  require(std::get<std::string>(items[6]) == "canvas", "root");
  require(std::get<std::string>(items[7]) == "group", "group kind");
  require(std::get<std::string>(items[8]) == "layer", "group id");
  require(std::get<double>(items[9]) == 11.0, "group child count");
  require(std::get<std::string>(items[10]) == "rectangle", "rectangle kind");
  require(std::get<std::string>(items[11]) == "box", "rectangle id");
  require(std::get<double>(items[12]) == 110.0, "group x offset");
  require(std::get<double>(items[13]) == 70.0, "group y offset");
  require(std::get<double>(items[14]) == 30.0, "rectangle w alias");
  require(std::get<double>(items[15]) == 40.0, "rectangle h alias");
  require(std::get<double>(items[16]) == 111.0, "relative point x");
  require(std::get<double>(items[17]) == 72.0, "relative point y");
  require(std::get<double>(items[18]) == 255.0, "fill red");
  require(std::get<double>(items[19]) == 255.0, "outline green");
  require(std::get<double>(items[20]) == 2.0, "outline thickness");
  require(std::get<double>(items[21]) == 0.25, "outline opacity");
  require(std::get<double>(items[22]) == 4.0, "corner top left");
  require(std::get<double>(items[23]) == 5.0, "corner top right");
  require(std::get<double>(items[24]) == 6.0, "corner bottom right");
  require(std::get<double>(items[25]) == 7.0, "corner bottom left");
  require(std::get<double>(items[26]) == 0.5, "opacity");
  require(std::get<double>(items[27]) == 3.0, "label padding");
  require(std::get<double>(items[28]) == 171.0, "font red");
  require(std::get<double>(items[29]) == 205.0, "font green");
  require(std::get<double>(items[30]) == 239.0, "font blue");
  require(std::get<std::string>(items[31]) == "default", "rectangle font family");
  require(std::get<double>(items[32]) == 7.0, "rectangle font size");
  require(std::get<std::string>(items[33]) == "left", "text align x");
  require(std::get<std::string>(items[34]) == "top", "text align y");
  require(std::get<std::string>(items[35]) == "Jayess", "rectangle child text");
  require(std::get<bool>(items[36]) == false, "clip");
  require(std::get<double>(items[37]) == 3.0, "z");
  require(std::get<std::string>(items[38]) == "ellipse", "ellipse");
  require(std::get<std::string>(items[39]) == "semiellipse", "semiellipse");
  require(std::get<std::string>(items[40]) == "triangle", "triangle");
  require(std::get<std::string>(items[41]) == "capsule", "capsule");
  require(std::get<std::string>(items[42]) == "line", "line");
  require(std::get<double>(items[43]) == 105.0, "line first point");
  require(std::get<double>(items[44]) == 66.0, "line second point");
  require(std::get<std::string>(items[45]) == "pixel", "pixel");
  require(std::get<std::string>(items[46]) == "polyline", "polyline");
  require(std::get<std::string>(items[47]) == "polygon", "polygon");
  require(std::get<std::string>(items[48]) == "image", "image");
  require(std::get<std::string>(items[49]) == "local.ppm", "image src");
  require(std::get<std::string>(items[50]) == "text", "text kind");
  require(std::get<std::string>(items[51]) == "Hi", "text value");
  require(std::get<std::string>(items[52]) == "default", "font family");
  require(std::get<double>(items[53]) == 7.0, "font size");
  require(std::get<double>(items[54]) == 4.0, "shadow offset x");
  require(std::get<double>(items[55]) == 5.0, "shadow offset y");
  require(std::get<double>(items[56]) == 6.0, "shadow blur");
  require(std::get<double>(items[57]) == 2.0, "shadow spread");
  require(std::get<double>(items[58]) == 1.0, "shadow red");
  require(std::get<double>(items[59]) == 2.0, "shadow green");
  require(std::get<double>(items[60]) == 3.0, "shadow blue");
  require(std::get<double>(items[61]) == 0.5, "shadow alpha");
  require(std::get<double>(items[62]) == 9.0, "line height");
  require(std::get<double>(items[63]) == 1.0, "letter spacing");
  require(std::get<double>(items[64]) == 2.0, "word spacing");
  require(std::get<std::string>(items[65]) == "uppercase", "text transform");
  require(std::get<std::string>(items[66]) == "underline", "text decoration");
  require(std::get<std::string>(items[67]) == "ellipsis", "text overflow");
  require(std::get<std::string>(items[68]) == "auto", "overflow");
  require(std::get<std::string>(items[69]) == "hidden", "overflow x");
  require(std::get<std::string>(items[70]) == "auto", "overflow y");
  require(std::get<double>(items[71]) == 3.0, "scrollbar width");
  require(std::get<double>(items[72]) == 136.0, "scrollbar thumb red");
  require(std::get<double>(items[73]) == 241.0, "scrollbar track red");

  auto responsiveValue = ${namespace}::responsiveSummary(std::vector<jayess::value>{});
  const auto& responsive = std::get<jayess::array_ptr>(responsiveValue)->items;
  require(std::get<std::string>(responsive[0]) == "row", "layout row");
  require(std::get<double>(responsive[1]) == 10.0, "layout padding");
  require(std::get<double>(responsive[2]) == 5.0, "layout gap");
  require(std::get<std::string>(responsive[3]) == "relative", "row child default relative");
  require(std::get<double>(responsive[4]) == 20.0, "row child x");
  require(std::get<double>(responsive[5]) == 40.0, "row child centered y");
  require(std::get<double>(responsive[6]) == 40.0, "percent width");
  require(std::get<double>(responsive[7]) == 20.0, "first child height");
  require(std::get<double>(responsive[8]) == 65.0, "second row child x");
  require(std::get<double>(responsive[9]) == 35.0, "percent height centered y");
  require(std::get<double>(responsive[10]) == 30.0, "second child width");
  require(std::get<double>(responsive[11]) == 30.0, "percent height");
  require(std::get<std::string>(responsive[12]) == "absolute", "absolute child");
  require(std::get<double>(responsive[13]) == 150.0, "right offset absolute x");
  require(std::get<double>(responsive[14]) == 65.0, "bottom offset absolute y");
  require(std::get<double>(responsive[15]) == 185.0, "fixed x");
  require(std::get<double>(responsive[16]) == 86.0, "fixed y");
  require(std::get<double>(responsive[17]) == 50.0, "max width");
  require(std::get<double>(responsive[18]) == 12.0, "min height");

  auto defaultFlowValue = ${namespace}::defaultFlowSummary(std::vector<jayess::value>{});
  const auto& defaultFlow = std::get<jayess::array_ptr>(defaultFlowValue)->items;
  require(std::get<std::string>(defaultFlow[0]) == "relative", "default first position");
  require(std::get<double>(defaultFlow[1]) == 5.0, "default first x");
  require(std::get<double>(defaultFlow[2]) == 5.0, "default first y");
  require(std::get<std::string>(defaultFlow[3]) == "relative", "default second position");
  require(std::get<double>(defaultFlow[4]) == 5.0, "default second x");
  require(std::get<double>(defaultFlow[5]) == 18.0, "default second y");

  auto defaultOverflowValue = ${namespace}::defaultTextOverflowSummary(std::vector<jayess::value>{});
  require(std::get<std::string>(defaultOverflowValue) == "overflow", "default text overflow");

  require(thrown_message(${namespace}::invalidForbiddenGeometry).find("radius-x") != std::string::npos, "forbidden geometry diagnostic");
  require(thrown_message(${namespace}::invalidPoints).find("points must use tuples") != std::string::npos, "points diagnostic");
  require(thrown_message(${namespace}::invalidUnknownElement).find("unknown element <button>") != std::string::npos, "unknown element diagnostic");
  require(thrown_message(${namespace}::invalidUnknownAttribute).find("unknown attribute radius-top") != std::string::npos, "unknown attribute diagnostic");
  require(thrown_message(${namespace}::invalidMissingRootSize).find("missing required attribute width") != std::string::npos, "missing root size diagnostic");
  require(thrown_message(${namespace}::invalidShadowAttribute).find("shadow must be") != std::string::npos, "shadow diagnostic");
  require(thrown_message(${namespace}::invalidXyAttribute).find("tuples") != std::string::npos, "xy diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ normalizes canvas XML scenes and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-xml-scene-main.js", "runtime-canvas-xml-scene", xmlSceneMain);
});
