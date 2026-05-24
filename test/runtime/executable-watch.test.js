import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function watchMain(targetDir, { header, namespace }) {
  return `#include <filesystem>
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
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
  const std::filesystem::path root = "${targetDir}/watch-fixture";
  std::filesystem::create_directories(root);
  const auto filePath = (root / "item.txt").generic_string();
  ${namespace}::jayess_module_init();

  auto opened = ${namespace}::open(std::vector<jayess::value>{root.generic_string()});
  const auto& openedItems = std::get<jayess::array_ptr>(opened)->items;
  auto watcher = openedItems[0];
  require(std::get<bool>(openedItems[1]) == true, "watcher handle");
  require(std::get<double>(openedItems[2]) == 0.0, "initial events");

  std::ofstream(filePath) << "one";
  std::this_thread::sleep_for(std::chrono::milliseconds(5));
  auto created = ${namespace}::readEvents(std::vector<jayess::value>{watcher});
  const auto& createdItems = std::get<jayess::array_ptr>(created)->items;
  require(!createdItems.empty(), "create event exists");
  auto first = std::get<jayess::object_ptr>(createdItems[0]);
  require(std::get<std::string>(first->fields["type"]) == "create", "create event type");

  auto closed = ${namespace}::closeWatcher(std::vector<jayess::value>{watcher});
  require(std::get<bool>(closed) == true, "close watcher");
  auto pathError = thrown_message(${namespace}::invalidPath);
  require(pathError.find("path must be a string") != std::string::npos, "path diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs filesystem watch polling operations", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/watch-main.js", "runtime-watch", watchMain);
});
