import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null || process.platform === "win32" ? test.skip : test;

function httpShutdownMain({ header, namespace }) {
  return `#include <chrono>
#include <cstdlib>
#include <exception>
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

jayess::value postText(const std::string& url, const std::string& body) {
  auto response = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("POST")},
    {"url", url},
    {"body", body}
  })));
  return jayess::http_response_text(response);
}

int main() {
  ${namespace}::jayess_module_init();

  const int shutdownPort = 45692;
  auto slowServer = ${namespace}::serveSlowEcho(std::vector<jayess::value>{
    static_cast<double>(shutdownPort),
    100.0
  });
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  std::string completedBody;
  std::exception_ptr requestFailure;
  std::thread inFlight([&]() {
    try {
      completedBody = std::get<std::string>(postText("http://127.0.0.1:45692/slow", "graceful body"));
    } catch (...) {
      requestFailure = std::current_exception();
    }
  });

  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto runningStateValue = ${namespace}::inspect(std::vector<jayess::value>{slowServer});
  auto runningState = std::get<jayess::object_ptr>(runningStateValue);
  require(std::get<bool>(runningState->fields.at("closed")) == false, "http server state starts open");
  ${namespace}::stop(std::vector<jayess::value>{slowServer});
  auto closedStateValue = ${namespace}::inspect(std::vector<jayess::value>{slowServer});
  auto closedState = std::get<jayess::object_ptr>(closedStateValue);
  require(std::get<bool>(closedState->fields.at("closed")) == true, "http server state reports closed");
  inFlight.join();
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  if (requestFailure != nullptr) {
    std::rethrow_exception(requestFailure);
  }
  require(completedBody == "graceful body", "graceful shutdown keeps active request");

  std::cout << "ok\\n" << std::flush;
  std::_Exit(0);
}
`;
}

runtimeTest("generated C++ keeps active HTTP requests alive through graceful shutdown on Unix-like hosts", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-shutdown-main.js", "runtime-http-shutdown", (_targetDir, entry) => httpShutdownMain(entry));
});
