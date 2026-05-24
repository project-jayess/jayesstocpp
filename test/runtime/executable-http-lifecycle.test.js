import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpLifecycleMain({ header, namespace }) {
  return `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

template <typename Fn>
void requireRuntimeError(Fn fn, const std::string& expected) {
  try {
    fn();
  } catch (const std::runtime_error& error) {
    require(std::string(error.what()) == expected, "runtime error message");
    return;
  }
  throw std::runtime_error("expected runtime_error");
}

jayess::value getText(const std::string& url) {
  auto response = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", url}
  })));
  return jayess::http_response_text(response);
}

int main() {
  ${namespace}::jayess_module_init();
  require(std::get<std::string>(${namespace}::composeResult(std::vector<jayess::value>{})) == "composed", "compose result");

  const int multiPort = 45684;
  auto server = ${namespace}::serveMulti(std::vector<jayess::value>{static_cast<double>(multiPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  require(std::get<std::string>(getText("http://127.0.0.1:45684/one")) == "request 1", "first request");
  require(std::get<std::string>(getText("http://127.0.0.1:45684/two")) == "request 2", "second request");
  ${namespace}::stop(std::vector<jayess::value>{server});
  requireRuntimeError([&]() {
    ${namespace}::stop(std::vector<jayess::value>{server});
  }, "Jayess http server handle is closed");

  const int paramsPort = 45685;
  auto paramsServer = ${namespace}::serveParams(std::vector<jayess::value>{static_cast<double>(paramsPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto response = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45685/users/42?include=true")}
  })));
  const auto& fields = std::get<jayess::object_ptr>(response)->fields;
  require(std::get<double>(fields.at("statusCode")) == 207.0, "params status");
  require(std::get<std::string>(jayess::http_response_text(response)) == "42", "route params");
  ${namespace}::stop(std::vector<jayess::value>{paramsServer});

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs multi-request http servers, close diagnostics, and route params", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-lifecycle-main.js", "runtime-http-lifecycle", (_targetDir, entry) => httpLifecycleMain(entry));
});
