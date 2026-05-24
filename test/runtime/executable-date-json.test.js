import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function dateMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{jayess::value(1000.0)});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 3, "date result length");
  require(std::get<double>(items[0]) == 2000.0, "date shifted millis");
  require(std::get<double>(items[1]) == 1000.0, "date diff millis");
  require(std::get<double>(items[2]) == 1970.0, "date parsed utc year");
  std::cout << "ok\\n";
  return 0;
}
`;
}

function jsonMain({ header, namespace }) {
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
  auto valid = ${namespace}::run(std::vector<jayess::value>{jayess::value(std::string("{\\"name\\":\\"Jayess\\",\\"values\\":[1,2]}"))});
  const auto& validItems = std::get<jayess::array_ptr>(valid)->items;
  require(validItems.size() == 3, "json valid result length");
  require(std::get<std::string>(validItems[0]) == "{\\"name\\":\\"Jayess\\",\\"values\\":[1,2]}", "json stringify");
  require(std::get<std::string>(validItems[1]).find("\\n  \\"name\\"") != std::string::npos, "json stringifyPretty");
  require(std::holds_alternative<std::monostate>(validItems[2]), "json validate valid");

  auto invalid = ${namespace}::run(std::vector<jayess::value>{jayess::value(std::string("{"))});
  const auto& invalidFields = std::get<jayess::object_ptr>(invalid)->fields;
  require(std::holds_alternative<std::string>(invalidFields.at("message")), "json validate message");
  require(std::holds_alternative<double>(invalidFields.at("line")), "json validate line");
  require(std::holds_alternative<double>(invalidFields.at("column")), "json validate column");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:date helper behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/date-main.js", "runtime-date-executable", (_targetDir, entry) => dateMain(entry));
});

runtimeTest("generated C++ runs jayess:json helper behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/json-main.js", "runtime-json-executable", (_targetDir, entry) => jsonMain(entry));
});
