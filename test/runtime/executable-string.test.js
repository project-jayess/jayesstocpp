import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function stringMain({ header, namespace }) {
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
  auto result = ${namespace}::inspect(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 12, "string hardening result length");
  require(std::get<std::string>(items[0]) == "", "string empty trim");
  require(std::get<bool>(items[1]) == true, "string empty startsWith");
  require(std::get<bool>(items[2]) == true, "string empty endsWith");
  require(std::get<bool>(items[3]) == true, "string empty includes");
  require(std::get<double>(items[4]) == 0.0, "string empty indexOf");
  require(std::get<std::string>(items[5]) == "", "string empty slice");
  require(std::get<double>(items[6]) == 0.0, "string empty split");
  require(std::get<double>(items[7]) == 3.0, "string split segment count");
  require(std::get<std::string>(items[8]) == "", "string split keeps empty segments");
  require(std::get<std::string>(items[9]) == "7", "string padStart unchanged");
  require(std::get<std::string>(items[10]) == "7", "string padEnd unchanged");
  require(std::get<std::string>(items[11]) == "", "string repeat zero");

  auto invalidNeedle = thrown_message(${namespace}::invalidIncludesNeedle);
  require(invalidNeedle.find("Jayess string includes expects a string needle") != std::string::npos, "string non-coercive includes");

  auto invalidArity = thrown_message(${namespace}::invalidPadEndArity);
  require(invalidArity.find("Jayess string padEnd expects two or three arguments") != std::string::npos, "string padEnd arity");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:string edge-case and non-coercive diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/string-hardening-main.js", "runtime-string-hardening", (_targetDir, entry) => stringMain(entry));
});
