import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpStaticMain(targetDir, { header, namespace }) {
  return `#include <chrono>
#include <filesystem>
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

void writeText(const std::filesystem::path& path, const std::string& text) {
  std::filesystem::create_directories(path.parent_path());
  std::ofstream output(path, std::ios::binary);
  output << text;
}

jayess::value request(const std::string& url) {
  return jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", url}
  })));
}

double statusCode(const jayess::value& response) {
  return std::get<double>(std::get<jayess::object_ptr>(response)->fields.at("statusCode"));
}

int main() {
  const auto root = std::filesystem::path("${targetDir}") / "static-root";
  writeText(root / "index.html", "home");
  writeText(root / "assets" / "app.js", "console.log('jayess');");

  ${namespace}::jayess_module_init();
  const int port = 45686;
  auto server = ${namespace}::serve(std::vector<jayess::value>{root.string(), static_cast<double>(port)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  auto indexResponse = request("http://127.0.0.1:45686/");
  require(statusCode(indexResponse) == 200.0, "index status");
  require(std::get<std::string>(jayess::http_response_text(indexResponse)) == "home", "index body");

  auto assetResponse = request("http://127.0.0.1:45686/assets/app.js?version=1");
  require(statusCode(assetResponse) == 200.0, "asset status");
  require(std::get<std::string>(jayess::http_response_text(assetResponse)) == "console.log('jayess');", "asset body");
  const auto& assetHeaders = std::get<jayess::object_ptr>(std::get<jayess::object_ptr>(assetResponse)->fields.at("headers"))->fields;
  require(std::get<std::string>(assetHeaders.at("Cache-Control")) == "max-age=60", "asset cache control");

  auto missingResponse = request("http://127.0.0.1:45686/missing.txt");
  require(statusCode(missingResponse) == 404.0, "missing status");

  auto unsafeResponse = request("http://127.0.0.1:45686/../secret.txt");
  require(statusCode(unsafeResponse) == 400.0, "unsafe status");

  ${namespace}::stop(std::vector<jayess::value>{server});
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ serves static files from a managed directory", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-static-main.js", "runtime-http-static", httpStaticMain);
});
