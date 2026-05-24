import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function numberMain({ header, namespace }) {
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
  require(items.size() == 11, "number hardening result length");
  require(std::get<bool>(items[0]) == true, "number isInteger true");
  require(std::get<bool>(items[1]) == false, "number isInteger false");
  require(std::get<bool>(items[2]) == true, "number isFinite true");
  require(std::get<bool>(items[3]) == false, "number isFinite non-number false");
  require(std::get<double>(items[4]) == 12.0, "number parseInt trim/sign");
  require(std::get<double>(items[5]) == -5.0, "number parseFloat exponent");
  require(std::get<double>(items[6]) == 600.0, "number parseFloat full exponent");
  require(std::holds_alternative<std::monostate>(items[7]), "number parseInt empty");
  require(std::holds_alternative<std::monostate>(items[8]), "number parseInt trailing junk");
  require(std::holds_alternative<std::monostate>(items[9]), "number parseFloat trailing junk");
  require(std::holds_alternative<std::monostate>(items[10]), "number parseFloat empty");

  auto invalidInput = thrown_message(${namespace}::invalidParseInput);
  require(invalidInput.find("Jayess number parsing expects a string input") != std::string::npos, "number parse input diagnostic");

  auto invalidFloatInput = thrown_message(${namespace}::invalidParseFloatInput);
  require(invalidFloatInput.find("Jayess number parsing expects a string input") != std::string::npos, "number parseFloat input diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:number parsing edge cases and exact diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/number-hardening-main.js", "runtime-number-hardening", (_targetDir, entry) => numberMain(entry));
});
