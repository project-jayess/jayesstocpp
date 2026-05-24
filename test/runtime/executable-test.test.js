import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function testMain({ header, namespace }) {
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

int main() {
  ${namespace}::jayess_module_init();
  auto suiteHandle = ${namespace}::runSuite(std::vector<jayess::value>{});
  auto suite = jayess::await_sync(suiteHandle);
  const auto& fields = std::get<jayess::object_ptr>(suite)->fields;
  require(std::get<double>(fields.at("total")) == 4.0, "test total");
  require(std::get<double>(fields.at("passed")) == 3.0, "test passed");
  require(std::get<double>(fields.at("failed")) == 1.0, "test failed");
  const auto& results = std::get<jayess::array_ptr>(fields.at("results"))->items;
  require(results.size() == 4, "test results length");
  const auto& failedFields = std::get<jayess::object_ptr>(results[3])->fields;
  require(std::get<bool>(failedFields.at("failed")) == true, "failed result flag");
  require(std::get<std::string>(failedFields.at("name")) == "failure capture", "failed result name");

  bool sawInvalidName = false;
  try {
    ${namespace}::invalidName(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    sawInvalidName = std::get<std::string>(jayess::exception_to_value(error)) == "jayess:test requires a non-empty test name";
  }
  require(sawInvalidName, "invalid test name diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:test helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/test-main.js", "runtime-test-stdlib", (_targetDir, entry) => testMain(entry));
});
