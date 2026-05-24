import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function iterMain({ header, namespace }) {
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
  require(items.size() == 11, "iter hardening result length");
  require(std::holds_alternative<std::monostate>(items[0]), "iter next empty");
  require(std::get<double>(items[1]) == 0.0, "iter take zero");
  require(std::get<bool>(items[2]) == true, "iter every empty");
  require(std::holds_alternative<std::monostate>(items[3]), "iter find empty");
  require(std::get<bool>(items[4]) == true, "iter some short-circuit result");
  require(std::get<double>(items[5]) == 6.0, "iter reduce total");
  require(std::get<double>(items[6]) == 4.0, "iter map value");
  require(std::get<double>(items[7]) == 2.0, "iter filter count");
  require(std::get<double>(items[8]) == 5.0, "iter chain length");
  require(std::holds_alternative<std::monostate>(items[9]), "iter forEach return");
  require(std::get<double>(items[10]) == 3.0, "iter forEach call count");

  auto callbackFailure = thrown_message(${namespace}::callbackFailure);
  require(callbackFailure == "iter callback boom", "iter callback failure propagation");

  auto generatorFailure = thrown_message(${namespace}::generatorFailure);
  require(generatorFailure == "iter boom", "iter generator failure propagation");

  auto invalidTake = thrown_message(${namespace}::invalidTakeCount);
  require(invalidTake.find("Jayess iterator take expects a non-negative integer count") != std::string::npos, "iter take count diagnostic");

  auto invalidRange = thrown_message(${namespace}::invalidRangeStep);
  require(invalidRange.find("Jayess iterator range expects a non-zero numeric step") != std::string::npos, "iter range step diagnostic");

  auto invalidNext = thrown_message(${namespace}::invalidNextInput);
  require(invalidNext.find("Jayess iterator helpers expect a generator handle") != std::string::npos, "iter next generator diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:iter completion and failure behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/iter-hardening-main.js", "runtime-iter-hardening", (_targetDir, entry) => iterMain(entry));
});
