import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpSessionMain(_targetDir, { header, namespace }) {
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
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspectSignedSession(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "user-1", "signed session verifies");
  require(std::get<bool>(items[1]) == true, "signed session rejects wrong secret");
  require(std::get<std::string>(items[2]) == "user-1", "signed session reads cookie");
  require(std::get<bool>(items[3]) == true, "signed session includes signature");
  auto invalid = thrown_message(${namespace}::invalidSessionValue);
  require(invalid.find("must not contain dots") != std::string::npos, "signed session value diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:http signed-session helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-session-main.js", "runtime-http-session", httpSessionMain);
});
