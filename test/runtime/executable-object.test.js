import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function objectMain({ header, namespace }) {
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
  require(items.size() == 13, "object hardening result length");
  require(std::get<bool>(items[0]) == true, "object has");
  require(std::get<std::string>(items[1]) == "apple", "object keys first");
  require(std::get<std::string>(items[2]) == "middle", "object keys second");
  require(std::get<std::string>(items[3]) == "zebra", "object keys third");
  require(std::get<double>(items[4]) == 1.0, "object values first");
  require(std::get<double>(items[5]) == 2.0, "object values second");
  require(std::get<double>(items[6]) == 3.0, "object values third");
  require(std::get<std::string>(items[7]) == "apple", "object entries first key");
  require(std::get<double>(items[8]) == 1.0, "object entries first value");
  require(std::get<double>(items[9]) == 1.0, "object assign copied field");
  require(std::get<bool>(items[10]) == true, "object assign kept target field");
  require(std::get<double>(items[11]) == 1.0, "object fromEntries alpha");
  require(std::get<double>(items[12]) == 2.0, "object fromEntries beta");

  auto invalidNull = thrown_message(${namespace}::invalidNullKeys);
  require(invalidNull.find("Expected a Jayess object-like value") != std::string::npos, "object null diagnostic");

  auto invalidKey = thrown_message(${namespace}::invalidNumericKey);
  require(invalidKey.find("Jayess object helper expects a string key") != std::string::npos, "object key diagnostic");

  auto invalidEntry = thrown_message(${namespace}::invalidEntryShape);
  require(invalidEntry.find("Jayess object entries must contain key and value") != std::string::npos, "object entry diagnostic");

  auto invalidAssign = thrown_message(${namespace}::invalidAssignSource);
  require(invalidAssign.find("Expected a Jayess object-like value") != std::string::npos, "object assign diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:object ordering and invalid-input diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/object-hardening-main.js", "runtime-object-hardening", (_targetDir, entry) => objectMain(entry));
});
