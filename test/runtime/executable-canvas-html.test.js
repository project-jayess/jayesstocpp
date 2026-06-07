import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasHtmlMain(targetDir, { header, namespace }) {
  const scenePath = JSON.stringify(`${targetDir}/canvas-html-scene.ppm`);
  return `#include <iostream>
#include <fstream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string thrownMessage(const jayess::thrown_value& error) {
  auto payload = jayess::exception_to_value(error);
  if (std::holds_alternative<std::string>(payload)) {
    return std::get<std::string>(payload);
  }
  return "";
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspect(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 1.0, "html root count");
  require(std::get<double>(items[1]) == 2.0, "css rule count");
  require(std::get<double>(items[2]) == 80.0, "html layout width");
  require(std::get<double>(items[3]) == 16.0, "html background red");
  require(std::get<std::string>(items[4]) == "ok", "html hit target");
  require(std::get<std::string>(items[5]) == "button", "html hit role");
  require(std::get<double>(items[6]) == 4.0, "gui html action count");
  require(std::get<std::string>(items[7]) == "htmlClick", "gui html click action type");
  require(std::get<std::string>(items[8]) == "ok", "gui html click action target");
  require(std::get<std::string>(items[9]) == "htmlInputFocus", "gui html focus action type");
  require(std::get<std::string>(items[10]) == "name", "gui html focus action target");
  require(std::get<std::string>(items[11]) == "A", "gui html focus value");
  require(std::get<std::string>(items[12]) == "htmlInput", "gui html input action type");
  require(std::get<std::string>(items[13]) == "AB", "gui html input value");
  require(std::get<std::string>(items[14]) == "htmlChange", "gui html change action type");
  require(std::get<std::string>(items[15]) == "AB", "gui html change value");

  auto boxResult = ${namespace}::inspectBoxModel(std::vector<jayess::value>{});
  const auto& boxItems = std::get<jayess::array_ptr>(boxResult)->items;
  require(std::get<double>(boxItems[0]) == 2.0, "html box css rule count");
  require(std::get<std::string>(boxItems[1]) == "descendant", "html descendant selector kind");
  require(std::get<double>(boxItems[2]) == 2.0, "html descendant selector chain");
  require(std::get<double>(boxItems[3]) == 1.0, "html border width metadata");
  require(std::get<double>(boxItems[4]) == 2.0, "html padding metadata");
  require(std::get<double>(boxItems[5]) == 20.0, "html wrapped text width");
  require(std::get<double>(boxItems[6]) == 4.0, "html wrapped text lines");
  require(std::get<double>(boxItems[7]) == 255.0, "html descendant color red");
  require(std::get<double>(boxItems[8]) == 255.0, "html border pixel red");
  require(std::get<std::string>(boxItems[9]) == "message", "html wrapped text hit target");

  auto constrainedResult = ${namespace}::inspectCssConstraints(std::vector<jayess::value>{});
  const auto& constrainedItems = std::get<jayess::array_ptr>(constrainedResult)->items;
  require(std::get<double>(constrainedItems[0]) == 50.0, "html constrained width");
  require(std::get<double>(constrainedItems[1]) == 24.0, "html constrained height");
  require(std::get<std::string>(constrainedItems[2]) == "hidden", "html overflow metadata");
  require(std::get<double>(constrainedItems[3]) == 40.0, "html child unclipped layout height");
  require(std::get<double>(constrainedItems[4]) == 255.0, "html visible clipped child pixel");
  require(std::get<double>(constrainedItems[5]) == 0.0, "html clipped child pixel");
  require(std::get<double>(constrainedItems[6]) == 255.0, "html constrained edge pixel");
  require(std::get<double>(constrainedItems[7]) == 50.0, "html min width style metadata");

  auto percentageResult = ${namespace}::inspectPercentageLayout(std::vector<jayess::value>{});
  const auto& percentageItems = std::get<jayess::array_ptr>(percentageResult)->items;
  require(std::get<double>(percentageItems[0]) == 100.0, "html percentage root width");
  require(std::get<double>(percentageItems[1]) == 60.0, "html percentage root height");
  require(std::get<double>(percentageItems[2]) == 88.0, "html percentage content width");
  require(std::get<double>(percentageItems[3]) == 44.0, "html percentage child width");
  require(std::get<double>(percentageItems[4]) == 24.0, "html percentage child height");
  require(std::get<double>(percentageItems[5]) == 255.0, "html percentage root border paint");
  require(std::get<double>(percentageItems[6]) == 255.0, "html percentage child paint");
  require(std::get<std::string>(percentageItems[7]) == "half", "html percentage hit target");

  auto compatibilityResult = ${namespace}::inspectCssCompatibility(std::vector<jayess::value>{});
  const auto& compatibilityItems = std::get<jayess::array_ptr>(compatibilityResult)->items;
  require(std::get<double>(compatibilityItems[0]) == 4.0, "html css compatibility rule count");
  require(std::get<std::string>(compatibilityItems[1]) == "child", "html child selector kind");
  require(std::get<std::string>(compatibilityItems[2]) == "true", "html boolean attribute value");
  require(std::get<std::string>(compatibilityItems[3]) == "child", "html unquoted id attribute value");
  require(std::get<double>(compatibilityItems[4]) == 255.0, "html comma selector color");
  require(std::get<double>(compatibilityItems[5]) == 100.0, "html compatibility root width");
  require(std::get<double>(compatibilityItems[6]) == 60.0, "html compatibility root height");
  require(std::get<double>(compatibilityItems[7]) == 56.0, "html content-box percentage width");
  require(std::get<double>(compatibilityItems[8]) == 36.0, "html content-box percentage height");
  require(std::get<double>(compatibilityItems[9]) == 2.0, "html content-box padding metadata");
  require(std::get<double>(compatibilityItems[10]) == 1.0, "html content-box border metadata");
  require(std::get<double>(compatibilityItems[11]) == 255.0, "html child selector paint");
  require(std::get<std::string>(compatibilityItems[12]) == "child", "html child selector hit target");

  auto maturityResult = ${namespace}::inspectHtmlMaturity(std::vector<jayess::value>{});
  const auto& maturityItems = std::get<jayess::array_ptr>(maturityResult)->items;
  require(std::get<double>(maturityItems[0]) == 1.0, "html padding shorthand top");
  require(std::get<double>(maturityItems[1]) == 2.0, "html padding shorthand right");
  require(std::get<double>(maturityItems[2]) == 3.0, "html padding shorthand bottom");
  require(std::get<double>(maturityItems[3]) == 4.0, "html padding shorthand left");
  require(std::get<double>(maturityItems[4]) == 2.0, "html margin shorthand top");
  require(std::get<double>(maturityItems[5]) == 3.0, "html margin shorthand right");
  require(std::get<std::string>(maturityItems[6]) == "Hello Jayess", "html inline text flow");
  require(std::get<double>(maturityItems[7]) == 4.0, "html child margin shorthand left");
  require(std::get<double>(maturityItems[8]) == 3.0, "html child padding shorthand right");
  require(std::get<bool>(maturityItems[9]) == true, "html disabled button layout metadata");
  require(std::get<bool>(maturityItems[10]) == true, "html disabled input layout metadata");
  require(std::get<bool>(maturityItems[11]) == false, "html enabled submit hit metadata");
  require(std::get<bool>(maturityItems[12]) == true, "html disabled hit metadata");
  require(std::get<double>(maturityItems[13]) == 2.0, "html submit action count");
  require(std::get<std::string>(maturityItems[14]) == "htmlClick", "html submit click action");
  require(std::get<std::string>(maturityItems[15]) == "htmlSubmit", "html submit action type");
  require(std::get<std::string>(maturityItems[16]) == "login", "html submit form id");

  try {
    ${namespace}::invalidHtml(std::vector<jayess::value>{});
    throw std::runtime_error("invalid html accepted");
  } catch (const jayess::thrown_value& error) {
    require(thrownMessage(error).find("unsupported element") != std::string::npos, "invalid html diagnostic");
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()).find("unsupported element") != std::string::npos, "invalid html diagnostic");
  }

  try {
    ${namespace}::invalidCss(std::vector<jayess::value>{});
    throw std::runtime_error("invalid css accepted");
  } catch (const jayess::thrown_value& error) {
    require(thrownMessage(error).find("unsupported property") != std::string::npos, "invalid css diagnostic");
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()).find("unsupported property") != std::string::npos, "invalid css diagnostic");
  }

  auto scenePath = ${namespace}::renderScene(std::vector<jayess::value>{std::string(${scenePath})});
  std::ifstream scene(std::get<std::string>(scenePath), std::ios::binary);
  require(scene.good(), "canvas html image golden exists");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs canvas HTML/CSS renderer helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-html-main.js", "runtime-canvas-html-executable", canvasHtmlMain);
});
