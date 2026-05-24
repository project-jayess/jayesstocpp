import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function archiveMain(targetDir, { header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    return std::get<std::string>(error.value);
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  const std::string syncPath = "${targetDir}/archive-sync.tar";
  const std::string asyncPath = "${targetDir}/archive-async.tar";
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{syncPath, asyncPath});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) >= 2048.0, "tar bytes length");
  require(std::get<double>(items[1]) == 2.0, "extracted length");
  require(std::get<std::string>(items[2]) == "docs/readme.txt", "entry path");
  require(std::get<std::string>(items[3]) == "hello", "entry text");
  require(std::get<double>(items[4]) == 384.0, "entry mode");
  require(std::get<std::string>(items[5]) == "bytes", "sync read text");
  require(std::filesystem::exists(syncPath), "sync tar exists");

  auto asyncResult = jayess::await_sync(${namespace}::runAsync(std::vector<jayess::value>{asyncPath}));
  require(std::get<std::string>(asyncResult) == "hello bytes", "async read text");
  require(std::filesystem::exists(asyncPath), "async tar exists");

  require(thrown_message(${namespace}::unsafePath).find("must not contain ..") != std::string::npos, "unsafe path diagnostic");
  require(thrown_message(${namespace}::unsupportedType).find("regular file entries") != std::string::npos, "unsupported type diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs archive tar helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/archive-main.js", "runtime-archive-stdlib", archiveMain);
});
