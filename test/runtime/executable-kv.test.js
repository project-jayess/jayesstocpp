import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function kvMain(targetDir, { header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&), const std::string& root) {
  try {
    fn(std::vector<jayess::value>{root});
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
  const std::string root = "${targetDir}/kv-store";
  std::filesystem::create_directories(root);
  ${namespace}::jayess_module_init();
  auto answer = ${namespace}::writeRead(std::vector<jayess::value>{root});
  require(std::get<double>(answer) == 42.0, "kv write/read");
  auto count = ${namespace}::keyCount(std::vector<jayess::value>{root});
  require(std::get<double>(count) >= 2.0, "kv keys");
  auto removed = ${namespace}::removeOne(std::vector<jayess::value>{root});
  require(std::get<bool>(removed) == true, "kv delete");
  auto invalid = thrown_message(${namespace}::invalidKey, root);
  require(invalid.find("key must not contain") != std::string::npos, "kv invalid key diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:kv sync storage helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/kv-main.js", "runtime-kv", kvMain);
});
