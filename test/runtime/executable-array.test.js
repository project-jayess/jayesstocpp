import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function arrayMain({ header, namespace }) {
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
  require(items.size() == 11, "array hardening result length");
  require(std::get<double>(items[0]) == 0.0, "array empty slice");
  require(std::holds_alternative<std::monostate>(items[1]), "array empty find");
  require(std::get<double>(items[2]) == -1.0, "array empty findIndex");
  require(std::get<bool>(items[3]) == false, "array empty some");
  require(std::get<bool>(items[4]) == true, "array empty every");
  require(std::get<std::string>(items[5]) == "", "array empty join");
  require(std::get<double>(items[6]) == 0.0, "array empty reverse");
  require(std::get<double>(items[7]) == 0.0, "array empty sort");
  require(std::get<double>(items[8]) == 0.0, "array empty map");
  require(std::get<double>(items[9]) == 0.0, "array empty filter");
  require(std::get<double>(items[10]) == 7.0, "array empty reduce with initial");

  auto callbackFailure = thrown_message(${namespace}::callbackFailure);
  require(callbackFailure == "array boom", "array callback failure propagation");

  auto invalidArity = thrown_message(${namespace}::invalidSortArity);
  require(invalidArity.find("Jayess array sort expects at most one comparator callback") != std::string::npos, "array arity diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:array edge-case and callback diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/array-hardening-main.js", "runtime-array-hardening", (_targetDir, entry) => arrayMain(entry));
});
