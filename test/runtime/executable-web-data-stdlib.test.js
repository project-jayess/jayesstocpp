import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function webDataStdlibMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess", "query name");
  require(std::get<std::string>(items[1]) == "hello world", "query space");
  require(std::get<bool>(items[2]) == true, "query set");
  require(std::get<std::string>(items[3]) == "name=Jayess&mode=native", "query stringify");
  require(std::get<std::string>(items[4]) == "language", "form field");
  require(std::get<std::string>(items[5]) == "title=Jayess", "form stringify");
  require(std::get<std::string>(items[6]) == "text/html", "mime lookup");
  require(std::get<std::string>(items[7]) == ".json", "mime extension");
  require(std::get<bool>(items[8]) == true, "mime text");
  require(std::get<std::string>(items[9]) == "utf-8", "mime charset");
  require(std::get<std::string>(items[10]) == "jayess", "toml string");
  require(std::get<bool>(items[11]) == true, "toml bool");
  require(std::get<double>(items[12]) == 3.0, "toml number");
  require(std::get<bool>(items[13]) == true, "toml stringify");
  require(std::get<bool>(items[14]) == true, "log json");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs web and data standard-library helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/web-data-stdlib-main.js", "runtime-web-data-stdlib", (_targetDir, entry) => webDataStdlibMain(entry));
});
