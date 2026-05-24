import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function terminalMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == std::string("\\x1b[31m"), "ansi red");
  require(std::get<std::string>(items[1]) == "Hello", "strip ansi");
  require(std::get<std::string>(items[2]) == std::string("\\x1b[2;3H"), "cursor");
  require(std::get<std::string>(items[3]) == std::string("\\x1b[2J"), "clear screen");
  require(std::get<std::string>(items[4]) == std::string("\\x1b[2K"), "clear line");
  require(std::get<bool>(items[5]) == true, "size fallback");
  auto styleError = thrown_message(${namespace}::invalidStyle);
  require(styleError.find("style is not supported") != std::string::npos, "style diagnostic");
  auto cursorError = thrown_message(${namespace}::invalidCursor);
  require(cursorError.find("row must be a positive integer") != std::string::npos, "cursor diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs terminal display helper operations", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/terminal-main.js", "runtime-terminal", (_targetDir, entry) => terminalMain(entry));
});
