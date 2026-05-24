import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function asyncCompositionMain({ header, namespace }) {
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
  auto result = jayess::await_sync(${namespace}::run(std::vector<jayess::value>{}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;

  const auto& joined = std::get<jayess::array_ptr>(items[0])->items;
  require(joined.size() == 2, "async all length");
  require(std::get<double>(joined[0]) == 1.0, "async all first");
  require(std::get<double>(joined[1]) == 2.0, "async all second");

  const auto& settled = std::get<jayess::array_ptr>(items[1])->items;
  require(settled.size() == 2, "async allSettled length");
  const auto& settledFirst = std::get<jayess::object_ptr>(settled[0])->fields;
  const auto& settledSecond = std::get<jayess::object_ptr>(settled[1])->fields;
  require(std::get<std::string>(settledFirst.at("status")) == "resolved", "async settled first status");
  require(std::get<double>(settledFirst.at("value")) == 1.0, "async settled first value");
  require(std::get<std::string>(settledSecond.at("status")) == "rejected", "async settled second status");
  require(std::get<std::string>(settledSecond.at("reason")) == "late", "async settled second reason");

  require(std::get<double>(items[2]) == 4.0, "async any result");
  require(std::get<double>(items[3]) == 3.0, "async race result");
  std::cout << "ok\\n";
  return 0;
}
`;
}

function asyncFailureMain({ header, namespace }) {
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
  try {
    jayess::await_sync(${namespace}::run(std::vector<jayess::value>{}));
    throw std::runtime_error("expected async rejection");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(jayess::exception_to_value(error)) == "boom", "async rejection payload");
  }
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:async completion ordering helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/async-composition-main.js", "runtime-async-composition-executable", (_targetDir, entry) => asyncCompositionMain(entry));
});

runtimeTest("generated C++ propagates jayess:async rejection payloads", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/async-failure-main.js", "runtime-async-failure-executable", (_targetDir, entry) => asyncFailureMain(entry));
});
