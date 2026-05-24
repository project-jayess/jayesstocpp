import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null || process.platform === "win32" ? test.skip : test;

function httpLifecycleMain({ header, namespace }) {
  return `#include <array>
#include <chrono>
#include <cstdlib>
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
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

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
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  const int concurrentPort = 45687;
  auto concurrentServer = ${namespace}::serveEchoPath(std::vector<jayess::value>{static_cast<double>(concurrentPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  std::array<std::string, 3> concurrentResults;
  std::array<std::exception_ptr, 3> concurrentErrors;
  std::array<std::thread, 3> concurrentThreads;
  const std::array<std::string, 3> concurrentPaths = {
    "http://127.0.0.1:45687/task0",
    "http://127.0.0.1:45687/task1",
    "http://127.0.0.1:45687/task2"
  };
  for (std::size_t index = 0; index < concurrentThreads.size(); ++index) {
    concurrentThreads[index] = std::thread([&, index]() {
      try {
        concurrentResults[index] = std::get<std::string>(getText(concurrentPaths[index]));
      } catch (...) {
        concurrentErrors[index] = std::current_exception();
      }
    });
  }
  for (auto& worker : concurrentThreads) {
    worker.join();
  }
  for (const auto& failure : concurrentErrors) {
    if (failure != nullptr) {
      std::rethrow_exception(failure);
    }
  }
  for (std::size_t index = 0; index < concurrentResults.size(); ++index) {
    require(concurrentResults[index] == "/task" + std::to_string(index), "concurrent path echo");
  }
  ${namespace}::stop(std::vector<jayess::value>{concurrentServer});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  std::cout << "ok\\n" << std::flush;
  std::_Exit(0);
}
`;
}

runtimeTest("generated C++ runs multi-request and concurrent-request http servers with route params on Unix-like hosts", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-lifecycle-main.js", "runtime-http-lifecycle", (_targetDir, entry) => httpLifecycleMain(entry));
});
