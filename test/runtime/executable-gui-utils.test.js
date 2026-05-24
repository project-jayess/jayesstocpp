import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function guiUtilsMain({ header, namespace }) {
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
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspect(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<bool>(items[0]) == true, "layout contains");
  require(std::get<double>(items[1]) == 60.0, "layout intersection");
  require(std::get<double>(items[2]) == 5.0, "layout inset");
  require(std::get<double>(items[3]) == 2.0, "layout rows");
  require(std::get<double>(items[4]) == 25.0, "layout column y");
  require(std::get<double>(items[5]) == 4.0, "layout grid");
  require(std::get<double>(items[6]) == 11.0, "font width");
  require(std::get<double>(items[7]) == 7.0, "font height");
  require(std::get<double>(items[8]) == 255.0, "font draw pixel");
  require(std::get<double>(items[9]) == 8.0, "font line height");
  require(std::get<double>(items[10]) == 5.0, "font char width");
  require(std::get<double>(items[11]) == 11.0, "font multiline width");
  require(std::get<double>(items[12]) == 15.0, "font multiline height");
  require(std::get<double>(items[13]) == 255.0, "font second line pixel");
  require(std::get<double>(items[14]) == 90.0, "font aligned pixel");

  auto rectError = thrown_message(${namespace}::invalidRect);
  require(rectError.find("rectangle dimensions") != std::string::npos, "layout diagnostic");
  auto textError = thrown_message(${namespace}::invalidClipboardText);
  require(textError.find("writeText expects a string") != std::string::npos, "clipboard text diagnostic");
  auto unavailable = thrown_message(${namespace}::unavailableClipboard);
  require(unavailable.find("clipboard host adapter is not available") != std::string::npos, "clipboard unavailable diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs GUI utility helpers and reports clipboard availability", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gui-utils-main.js", "runtime-gui-utils", (_targetDir, entry) => guiUtilsMain(entry));
});
