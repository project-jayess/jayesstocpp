import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function workflowMain({ header, namespace }, body) {
  return `#include <chrono>
#include <fstream>
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

int main() {
  ${namespace}::jayess_module_init();
${body}
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs a CLI/config/fs workflow fixture", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/workflow-cli-config-main.js", "runtime-workflow-cli-config", (targetDir, entry) => workflowMain(entry, `  std::ofstream(std::string(${JSON.stringify(targetDir)}) + "/workflow-config.json") << "{\\\"name\\\":\\\"Jayess\\\",\\\"mode\\\":\\\"cli\\\"}";
  auto result = ${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))});
  require(std::get<std::string>(result) == "Jayess:cli:input.txt:true", "cli workflow output");`));
});

runtimeTest("generated C++ runs an HTTP JSON/static workflow fixture", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/workflow-http-main.js", "runtime-workflow-http", (targetDir, entry) => workflowMain(entry, `  const int port = 45710;
  const auto staticPath = std::string(${JSON.stringify(targetDir)}) + "/asset.txt";
  std::ofstream(staticPath) << "static asset";
  ${entry.namespace}::serve(std::vector<jayess::value>{jayess::value(static_cast<double>(port)), jayess::value(staticPath)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto jsonResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45710/data")}
  })));
  require(std::get<std::string>(jayess::http_response_text(jsonResponse)).find("workflow") != std::string::npos, "http json body");
  auto assetResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45710/asset")}
  })));
  require(std::get<std::string>(jayess::http_response_text(assetResponse)) == "static asset", "http static body");`));
});

runtimeTest("generated C++ runs a subprocess/stream workflow fixture", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/workflow-subprocess-pipeline-main.js", "runtime-workflow-subprocess-pipeline", (targetDir, entry) => workflowMain(entry, `  auto result = jayess::await_sync(${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "WORKFLOW", "subprocess transformed stdout");
  require(std::get<std::string>(items[1]) == "WORKFLOW", "stream copied transformed text");`));
});

runtimeTest("generated C++ runs an fs/glob/hash workflow fixture", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/workflow-fs-glob-hash-main.js", "runtime-workflow-fs-glob-hash", (targetDir, entry) => workflowMain(entry, `  std::ofstream(std::string(${JSON.stringify(targetDir)}) + "/alpha.txt") << "alpha";
  std::ofstream(std::string(${JSON.stringify(targetDir)}) + "/beta.txt") << "beta";
  std::ofstream(std::string(${JSON.stringify(targetDir)}) + "/skip.bin") << "skip";
  auto result = ${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 2.0, "glob txt count");
  require(std::get<double>(items[1]) == 64.0, "alpha sha length");
  require(std::get<double>(items[2]) == 64.0, "beta sha length");`));
});

runtimeTest("generated C++ runs an async subprocess cancellation workflow fixture", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/workflow-async-cancellation-main.js", "runtime-workflow-async-cancellation", (_targetDir, entry) => workflowMain(entry, `  auto result = jayess::await_sync(${entry.namespace}::run(std::vector<jayess::value>{}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "token", "cancellation subprocess output");
  require(std::get<std::string>(items[1]) == "timeout", "timeout cancellation subprocess output");`));
});
