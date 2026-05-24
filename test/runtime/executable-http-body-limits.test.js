import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpBodyLimitsMain(targetDir, { header, namespace }) {
  return `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

int main() {
  ${namespace}::jayess_module_init();
  auto server = ${namespace}::serveLimited(std::vector<jayess::value>{45693.0, 4.0, 8.0});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  auto oversizedRequest = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("POST")},
    {"url", std::string("http://127.0.0.1:45693/")},
    {"body", std::string("hello")}
  })));
  const auto& oversizedRequestFields = std::get<jayess::object_ptr>(oversizedRequest)->fields;
  require(std::get<double>(oversizedRequestFields.at("statusCode")) == 413.0, "http request body limit status");
  require(std::get<std::string>(jayess::http_response_text(oversizedRequest)).find("maxRequestBodyBytes") != std::string::npos, "http request body limit body");

  auto oversizedResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45693/large-response")}
  })));
  const auto& oversizedResponseFields = std::get<jayess::object_ptr>(oversizedResponse)->fields;
  require(std::get<double>(oversizedResponseFields.at("statusCode")) == 500.0, "http response body limit status");
  require(std::get<std::string>(jayess::http_response_text(oversizedResponse)).find("maxResponseBodyBytes") != std::string::npos, "http response body limit body");

  auto validResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45693/ok")}
  })));
  const auto& validFields = std::get<jayess::object_ptr>(validResponse)->fields;
  require(std::get<double>(validFields.at("statusCode")) == 200.0, "http valid request survives body limit probes");
  require(std::get<std::string>(jayess::http_response_text(validResponse)) == "ok", "http valid body limit response");

  jayess::http_close_server(server);
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ enforces HTTP request and response body limits", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-limits-main.js", "runtime-http-body-limits-executable", httpBodyLimitsMain);
});
