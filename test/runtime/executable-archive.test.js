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
  require(std::get<double>(items[1]) == 3.0, "extracted length");
  require(std::get<std::string>(items[2]) == "docs/readme.txt", "entry path");
  require(std::get<std::string>(items[3]) == "hello", "entry text");
  require(std::get<double>(items[4]) == 384.0, "entry mode");
  require(std::get<std::string>(items[5]) == "bytes", "sync read text");
  require(std::get<std::string>(items[6]) == "directory", "directory type");
  require(std::get<double>(items[7]) == 56.0, "directory mtime");
  require(std::filesystem::exists(syncPath), "sync tar exists");

  auto asyncResult = jayess::await_sync(${namespace}::runAsync(std::vector<jayess::value>{asyncPath}));
  require(std::get<std::string>(asyncResult) == "hello bytes", "async read text");
  require(std::filesystem::exists(asyncPath), "async tar exists");

  const std::string directoryRoot = "${targetDir}/directory-helpers";
  auto directoryResult = ${namespace}::runDirectorySync(std::vector<jayess::value>{directoryRoot});
  const auto& directoryItems = std::get<jayess::array_ptr>(directoryResult)->items;
  require(std::get<double>(directoryItems[0]) == 2.0, "directory extract count");
  require(std::get<std::string>(directoryItems[1]) == "docs", "directory archive first path");
  require(std::get<std::string>(directoryItems[2]) == "directory", "directory extracted text");

  auto asyncDirectoryResult = jayess::await_sync(${namespace}::runDirectoryAsync(std::vector<jayess::value>{directoryRoot}));
  const auto& asyncDirectoryItems = std::get<jayess::array_ptr>(asyncDirectoryResult)->items;
  require(std::get<double>(asyncDirectoryItems[0]) == 2.0, "async directory extract count");
  require(std::get<std::string>(asyncDirectoryItems[1]) == "async directory", "async directory extracted text");

  require(thrown_message(${namespace}::unsafePath).find("must not contain ..") != std::string::npos, "unsafe path diagnostic");
  require(thrown_message(${namespace}::unsupportedType).find("regular file and directory entries") != std::string::npos, "unsupported type diagnostic");
  require(thrown_message(${namespace}::duplicatePath).find("unique") != std::string::npos, "duplicate path diagnostic");
  require(thrown_message(${namespace}::unsafeEmptySegment).find("empty path segments") != std::string::npos, "empty segment diagnostic");
  require(thrown_message(${namespace}::unsafeDirectoryContent).find("directory entries must not include content") != std::string::npos, "directory content diagnostic");
  try {
    ${namespace}::directoryHelperUnsupportedOptions(std::vector<jayess::value>{directoryRoot});
    throw std::runtime_error("archive directory helper options accepted");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(error.value).find("options are unsupported") != std::string::npos, "directory helper options diagnostic");
  } catch (const std::exception& error) {
    require(std::string(error.what()).find("options are unsupported") != std::string::npos, "directory helper options diagnostic");
  }
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs archive tar helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/archive-main.js", "runtime-archive-stdlib", archiveMain);
});
