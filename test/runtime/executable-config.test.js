import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function configMain(root, { header, namespace }) {
  return `#include <filesystem>
#include <iostream>
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
  auto syncResult = ${namespace}::runSync(std::vector<jayess::value>{std::string("${root}")});
  const auto& syncItems = std::get<jayess::array_ptr>(syncResult)->items;
  require(std::get<std::string>(syncItems[0]) == "Jayess", "sync json name");
  require(std::get<std::string>(syncItems[1]) == "native", "sync dotenv mode");

  auto asyncHandle = ${namespace}::run(std::vector<jayess::value>{std::string("${root}")});
  auto asyncResult = jayess::await_sync(asyncHandle);
  const auto& asyncItems = std::get<jayess::array_ptr>(asyncResult)->items;
  require(std::get<std::string>(asyncItems[0]) == "Jayess", "async json name");
  require(std::get<std::string>(asyncItems[1]) == "jayess", "async toml mode");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs config standard-library helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/config-main.js", "runtime-config-stdlib", (targetDir, entry) => {
    fs.writeFileSync(path.join(targetDir, "settings.json"), "{\"name\":\"Jayess\",\"mode\":\"json\"}", "utf8");
    fs.writeFileSync(path.join(targetDir, "settings.toml"), "[package]\nname = \"jayess\"", "utf8");
    fs.writeFileSync(path.join(targetDir, "settings.env"), "MODE=native", "utf8");
    return configMain(targetDir, entry);
  });
});
