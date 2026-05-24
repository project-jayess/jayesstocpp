import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function canvasClipMain(targetDir, { header, namespace }) {
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
  require(std::get<double>(items[0]) == 3.0, "base clip width");
  require(std::get<double>(items[1]) == 3.0, "active clip width");
  require(std::get<double>(items[2]) == 3.0, "active clip height");
  require(std::get<double>(items[3]) == 1.0, "nested clip width");
  require(std::get<double>(items[4]) == 1.0, "nested clip height");
  require(std::get<double>(items[5]) == 3.0, "restored clip width");
  require(std::get<double>(items[6]) == 3.0, "restored clip height");
  require(std::get<double>(items[7]) == 90.0, "nested clipped drawImage pixel");
  require(std::get<double>(items[8]) == 10.0, "stack clipped fill pixel");
  require(std::get<double>(items[9]) == 0.0, "outside clip pixel");
  require(std::get<double>(items[10]) == 5.0, "full clip width");
  require(std::get<double>(items[11]) == 5.0, "full clip height");

  auto popClipError = thrown_message(${namespace}::invalidPopClip);
  require(popClipError.find("active clip") != std::string::npos, "invalid popClip diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs canvas clip stack helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-clip-main.js", "runtime-canvas-clip", canvasClipMain);
});
