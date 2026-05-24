import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function asyncThreadCoordinationMain({ header, namespace }) {
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
  auto asyncResult = jayess::await_sync(${namespace}::runAsync(std::vector<jayess::value>{}));
  const auto& asyncItems = std::get<jayess::array_ptr>(asyncResult)->items;
  require(std::get<bool>(asyncItems[0]) == true, "token cancelled");
  require(std::get<std::string>(asyncItems[1]) == "stop", "token reason");
  require(std::get<std::string>(asyncItems[2]) == "stop", "when cancelled");
  require(std::get<std::string>(asyncItems[3]) == "ok", "with cancellation");
  require(std::get<bool>(asyncItems[4]) == true, "sleep cancellation");
  require(std::get<std::string>(asyncItems[5]) == "soon", "with timeout");
  require(std::get<std::string>(asyncItems[6]) == "nested", "timeout with cancellation");

  auto syncResult = ${namespace}::runSync(std::vector<jayess::value>{});
  const auto& syncItems = std::get<jayess::array_ptr>(syncResult)->items;
  require(std::get<std::string>(syncItems[0]) == "value", "channel receive");
  require(std::holds_alternative<std::monostate>(syncItems[1]), "empty channel receive");
  require(std::get<bool>(syncItems[2]) == true, "channel closed");
  require(std::get<double>(syncItems[3]) == 42.0, "workqueue result");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs async cancellation and thread coordination helpers", (t) => {
  transpileAndRunFixture(
    t,
    "test/fixtures/modules/async-thread-coordination-main.js",
    "runtime-async-thread-coordination",
    (_targetDir, entry) => asyncThreadCoordinationMain(entry)
  );
});
