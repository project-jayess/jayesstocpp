import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageSubimageMain(targetDir, { header, namespace }) {
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
  require(std::get<double>(items[0]) == 2.0, "subimage width");
  require(std::get<double>(items[1]) == 2.0, "subimage height");
  require(std::get<double>(items[2]) == 255.0, "subimage initial red");
  require(std::get<double>(items[3]) == 255.0, "subimage stays copied after source mutation");
  require(std::get<double>(items[4]) == 0.0, "subimage does not inherit source green mutation");
  require(std::get<double>(items[5]) == 255.0, "source stays independent after child mutation");
  require(std::get<double>(items[6]) == 255.0, "child mutation red");
  require(std::get<double>(items[7]) == 255.0, "child mutation green");
  require(std::get<double>(items[8]) == 0.0, "child mutation blue");

  auto error = thrown_message(${namespace}::invalidSubimage);
  require(error.find("crop rectangle") != std::string::npos, "subimage bounds diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs image subimage copy helper", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-subimage-main.js", "runtime-image-subimage", imageSubimageMain);
});
