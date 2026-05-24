import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function regexMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{jayess::value(std::string("abb abb"))});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<bool>(items[0]) == true, "regex identity");
  require(std::get<bool>(items[1]) == true, "regex match");
  require(std::get<bool>(items[2]) == true, "regex case-insensitive match");
  require(std::get<bool>(items[3]) == true, "regex dot-all match");

  const auto& execMatch = std::get<jayess::array_ptr>(items[4])->items;
  require(execMatch.size() == 2, "regex exec result length");
  require(std::get<std::string>(execMatch[0]) == "abb", "regex exec full match");
  require(std::get<std::string>(execMatch[1]) == "bb", "regex exec capture");
  require(jayess::is_null(items[5]), "regex exec no-match");

  const auto& splitItems = std::get<jayess::array_ptr>(items[6])->items;
  require(splitItems.size() == 3, "regex split length");
  require(std::get<std::string>(splitItems[0]) == "a", "regex split first");
  require(std::get<std::string>(splitItems[1]) == "b", "regex split second");
  require(std::get<std::string>(splitItems[2]) == "c", "regex split third");

  const auto& allMatches = std::get<jayess::array_ptr>(items[7])->items;
  require(allMatches.size() == 2, "regex matchAll length");
  const auto& firstMatch = std::get<jayess::array_ptr>(allMatches[0])->items;
  const auto& secondMatch = std::get<jayess::array_ptr>(allMatches[1])->items;
  require(std::get<std::string>(firstMatch[0]) == "abb", "regex first full match");
  require(std::get<std::string>(firstMatch[1]) == "bb", "regex first capture");
  require(std::get<std::string>(secondMatch[0]) == "abb", "regex second full match");
  require(std::get<std::string>(secondMatch[1]) == "bb", "regex second capture");

  require(std::get<std::string>(items[8]) == "x abb", "regex replaceFirst");
  require(std::get<std::string>(items[9]) == "x x", "regex replaceAll");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:regex helper behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/regex-main.js", "runtime-regex-executable", (_targetDir, entry) => regexMain(entry));
});
