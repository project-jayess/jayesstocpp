import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpRequestHelpersMain(_targetDir, { header, namespace }) {
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
  auto result = ${namespace}::inspectRequestHelpers(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "/users/42?tab=profile&empty=", "request helper url");
  require(std::get<std::string>(items[1]) == "/users/42", "request helper pathname");
  require(std::get<std::string>(items[2]) == "profile", "request helper queryParam");
  require(std::get<bool>(items[3]) == true, "request helper missing queryParam");
  require(std::get<std::string>(items[4]) == "", "request helper empty query value");
  require(std::get<std::string>(items[5]) == "/health", "request helper plain pathname");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:http request helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-request-helpers-main.js", "runtime-http-request-helpers", httpRequestHelpersMain);
});
