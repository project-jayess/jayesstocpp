import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function mapMain({ header, namespace }) {
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
  require(std::get<std::string>(items[0]) == "jayess", "map get result");

  const auto& keyList = std::get<jayess::array_ptr>(items[1])->items;
  require(keyList.size() == 2, "map keys length");
  require(std::get<std::string>(keyList[0]) == "name", "map first key");
  require(std::get<std::string>(keyList[1]) == "kind", "map second key");

  const auto& valueList = std::get<jayess::array_ptr>(items[2])->items;
  require(valueList.size() == 2, "map values length");
  require(std::get<std::string>(valueList[0]) == "jayess", "map first value");
  require(std::get<std::string>(valueList[1]) == "language", "map second value");

  const auto& entryList = std::get<jayess::array_ptr>(items[3])->items;
  require(entryList.size() == 2, "map entries length");
  const auto& firstEntry = std::get<jayess::array_ptr>(entryList[0])->items;
  const auto& secondEntry = std::get<jayess::array_ptr>(entryList[1])->items;
  require(std::get<std::string>(firstEntry[0]) == "name", "map first entry key");
  require(std::get<std::string>(firstEntry[1]) == "jayess", "map first entry value");
  require(std::get<std::string>(secondEntry[0]) == "kind", "map second entry key");
  require(std::get<std::string>(secondEntry[1]) == "language", "map second entry value");

  const auto& copied = items[4];
  require(std::get<double>(jayess::map_size(copied)) == 2.0, "map copied size");
  require(std::get<bool>(jayess::map_has(copied, jayess::value(std::string("name")))) == true, "map copied has name");
  require(std::get<bool>(jayess::map_has(copied, jayess::value(std::string("kind")))) == false, "map copied removed kind");
  require(std::get<std::string>(jayess::map_get(copied, jayess::value(std::string("stage")))) == "bulk", "map copied bulk stage");
  std::cout << "ok\\n";
  return 0;
}
`;
}

function setMain({ header, namespace }) {
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
  require(std::get<std::string>(items[0]) == "jayess", "set probe marker");

  const auto& valueList = std::get<jayess::array_ptr>(items[1])->items;
  require(valueList.size() == 2, "set values length");
  require(std::get<std::string>(valueList[0]) == "jayess", "set first value");
  require(std::get<std::string>(valueList[1]) == "native", "set second value");

  const auto& entryList = std::get<jayess::array_ptr>(items[2])->items;
  require(entryList.size() == 2, "set entries length");
  const auto& firstEntry = std::get<jayess::array_ptr>(entryList[0])->items;
  require(std::get<std::string>(firstEntry[0]) == "jayess", "set first entry left");
  require(std::get<std::string>(firstEntry[1]) == "jayess", "set first entry right");

  const auto& either = items[3];
  require(std::get<double>(jayess::set_size(either)) == 3.0, "set union size");
  require(std::get<bool>(jayess::set_has(either, jayess::value(std::string("compiled")))) == true, "set union has compiled");

  const auto& both = items[4];
  require(std::get<double>(jayess::set_size(both)) == 2.0, "set intersection size");
  require(std::get<bool>(jayess::set_has(both, jayess::value(std::string("jayess")))) == true, "set intersection has jayess");
  require(std::get<bool>(jayess::set_has(both, jayess::value(std::string("compiled")))) == false, "set intersection omits compiled");

  const auto& leftOnly = items[5];
  require(std::get<double>(jayess::set_size(leftOnly)) == 1.0, "set difference size");
  require(std::get<bool>(jayess::set_has(leftOnly, jayess::value(std::string("compiled")))) == true, "set difference has compiled");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:collections/map helper behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/map-main.js", "runtime-map-executable", (_targetDir, entry) => mapMain(entry));
});

runtimeTest("generated C++ runs jayess:collections/set helper behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/set-main.js", "runtime-set-executable", (_targetDir, entry) => setMain(entry));
});
