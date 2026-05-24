import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function cookieMain(_targetDir, { header, namespace }) {
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
  auto session = ${namespace}::parseSession(std::vector<jayess::value>{std::string("theme=dark; session=abc")});
  require(std::get<std::string>(session) == "abc", "cookie parse");
  auto serialized = ${namespace}::serializeSession(std::vector<jayess::value>{});
  const auto text = std::get<std::string>(serialized);
  require(text.find("session=abc") != std::string::npos, "cookie serialize name");
  require(text.find("HttpOnly") != std::string::npos, "cookie serialize httpOnly");
  require(text.find("SameSite=Lax") != std::string::npos, "cookie serialize sameSite");
  auto request = jayess::make_object({
    {"method", std::string("GET")},
    {"path", std::string("/")},
    {"headers", jayess::make_object({{"cookie", std::string("session=abc")}})},
    {"body", std::string("")}
  });
  auto read = ${namespace}::readSession(std::vector<jayess::value>{request});
  require(std::get<std::string>(read) == "abc", "cookie request get");
  auto invalid = thrown_message(${namespace}::invalidCookie);
  require(invalid.find("valid token") != std::string::npos, "cookie invalid diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:cookie parse and serialize helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/cookie-main.js", "runtime-cookie", cookieMain);
});
