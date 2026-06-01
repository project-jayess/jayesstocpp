import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function consoleInputMain({ header, namespace }) {
  return `#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    std::cerr << message << "\\n";
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
  std::istringstream input("first\\nsecond\\nrest");
  auto* oldCin = std::cin.rdbuf(input.rdbuf());
  std::ostringstream capturedOutput;
  auto* oldCout = std::cout.rdbuf(capturedOutput.rdbuf());

  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspectInput(std::vector<jayess::value>{});

  std::cin.rdbuf(oldCin);
  std::cout.rdbuf(oldCout);

  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "first", "readLine result");
  require(std::get<std::string>(items[1]) == "second", "prompt result");
  require(std::get<std::string>(items[2]) == "rest", "readStdin result");
  require(std::holds_alternative<std::monostate>(items[3]), "readLine EOF result");
  require(capturedOutput.str() == "name: ", "prompt writes prompt text");

  auto invalid = thrown_message(${namespace}::invalidPrompt);
  require(invalid.find("Jayess console prompt expects a string text value") != std::string::npos, "prompt diagnostic");

  std::cout << "ok\\\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs console stdin helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/console-input-main.js", "runtime-console-input", (_targetDir, entry) => consoleInputMain(entry));
});
