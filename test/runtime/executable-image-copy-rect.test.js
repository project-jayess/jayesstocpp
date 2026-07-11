import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageCopyRectMain(targetDir, { header, namespace }) {
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
  require(std::get<double>(items[0]) == 20.0, "vertical overlap copied row 2");
  require(std::get<double>(items[1]) == 30.0, "vertical overlap copied row 3");
  require(std::get<double>(items[2]) == 22.0, "horizontal overlap copied column 2");
  require(std::get<double>(items[3]) == 33.0, "horizontal overlap copied column 3");
  require(std::get<double>(items[4]) == 77.0, "clipped copy wrote visible pixel");
  require(std::get<double>(items[5]) > 0.5 && std::get<double>(items[5]) < 0.502, "copyRect preserved alpha");
  require(std::get<double>(items[6]) == 0.0, "clipped copy left hidden pixel");

  auto widthError = thrown_message(${namespace}::invalidCopyRectWidth);
  require(widthError.find("copyRect width") != std::string::npos, "copyRect width diagnostic");
  auto targetError = thrown_message(${namespace}::invalidCopyRectTargetX);
  require(targetError.find("copyRect target x") != std::string::npos, "copyRect target x diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs image copyRect helper", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-copy-rect-main.js", "runtime-image-copy-rect", imageCopyRectMain);
});
