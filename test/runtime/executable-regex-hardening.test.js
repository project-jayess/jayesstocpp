import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function regexMain({ header, namespace }) {
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
  require(items.size() == 4, "regex hardening result length");
  require(std::holds_alternative<std::monostate>(items[0]), "regex exec no match");
  require(std::get<double>(items[1]) == 0.0, "regex matchAll empty");
  require(std::get<std::string>(items[2]) == "abc", "regex replaceFirst unchanged");
  require(std::get<std::string>(items[3]) == "abc", "regex replaceAll unchanged");

  auto invalidPattern = thrown_message(${namespace}::invalidPattern);
  require(invalidPattern.find("Invalid Jayess regex pattern") != std::string::npos, "regex invalid pattern diagnostic");

  auto invalidText = thrown_message(${namespace}::invalidTextInput);
  require(invalidText.find("Jayess regex operations expect a string text input") != std::string::npos, "regex invalid text diagnostic");

  auto invalidReplacement = thrown_message(${namespace}::invalidReplacementCallback);
  require(invalidReplacement.find("Jayess regex replacement expects a string replacement input") != std::string::npos, "regex callback replacement rejection");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:regex hardening behavior and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/regex-hardening-main.js", "runtime-regex-hardening", (_targetDir, entry) => regexMain(entry));
});
