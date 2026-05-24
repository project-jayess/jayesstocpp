import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageRectMain(targetDir, { header, namespace }) {
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
  require(std::get<double>(items[0]) == 20.0, "fillRect red");
  require(std::get<double>(items[1]) == 40.0, "fillRect green");
  require(std::get<double>(items[2]) == 60.0, "fillRect blue");
  require(std::get<double>(items[3]) == 0.0, "fillRect leaves untouched pixels");
  require(std::get<double>(items[4]) == 128.0, "fillRectAlpha red");
  require(std::get<double>(items[5]) == 0.0, "fillRectAlpha green");
  require(std::get<double>(items[6]) == 127.0, "fillRectAlpha blue");
  require(std::get<double>(items[7]) == 255.0, "fillRect clipping writes visible pixel");
  require(std::get<double>(items[8]) == 0.0, "fillRect clipping leaves hidden pixel");

  auto widthError = thrown_message(${namespace}::invalidFillRect);
  require(widthError.find("fillRect width") != std::string::npos, "fillRect width diagnostic");
  auto heightError = thrown_message(${namespace}::invalidFillRectAlpha);
  require(heightError.find("fillRectAlpha height") != std::string::npos, "fillRectAlpha height diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs image bulk rectangle helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-rect-main.js", "runtime-image-rect", imageRectMain);
});
