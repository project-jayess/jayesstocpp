import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function urlMain({ header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspect(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 12, "url hardening result length");
  require(std::get<std::string>(items[0]) == "", "url relative scheme");
  require(std::get<std::string>(items[1]) == "", "url relative host");
  require(std::get<std::string>(items[2]) == "/docs/start", "url relative path");
  require(std::get<std::string>(items[3]) == "lang=js", "url relative query");
  require(std::get<std::string>(items[4]) == "top", "url relative fragment");
  require(std::get<std::string>(items[5]) == "example.com/", "url format host only");
  require(std::get<std::string>(items[6]) == "https://example.com/docs/next?lang=js#top", "url join relative");
  require(std::get<std::string>(items[7]) == "https://example.com/reset?lang=js#top", "url join absolute path");
  require(std::get<std::string>(items[8]) == "one", "url first query match");
  require(std::holds_alternative<std::monostate>(items[9]), "url missing query returns null");
  require(std::get<std::string>(items[10]) == "https://example.com/?tag=one&mode=new#frag", "url setQuery updates");
  require(std::get<std::string>(items[11]) == "https://example.com/docs?lang=jayess", "url setQuery appends");

  auto invalidParse = thrown_message(${namespace}::invalidParseInput);
  require(invalidParse.find("Jayess url parse expects a string input") != std::string::npos, "url parse diagnostic");

  auto invalidFormat = thrown_message(${namespace}::invalidFormatInput);
  require(invalidFormat.find("Jayess url format expects an object input") != std::string::npos, "url format object diagnostic");

  auto invalidField = thrown_message(${namespace}::invalidFormatField);
  require(invalidField.find("Jayess url format expects string fields") != std::string::npos, "url format field diagnostic");

  auto invalidJoin = thrown_message(${namespace}::invalidJoinPathInput);
  require(invalidJoin.find("Jayess url joinPath expects a string path") != std::string::npos, "url joinPath path diagnostic");

  auto invalidKey = thrown_message(${namespace}::invalidGetQueryKey);
  require(invalidKey.find("Jayess url getQuery expects a string key") != std::string::npos, "url getQuery key diagnostic");

  auto invalidValue = thrown_message(${namespace}::invalidSetQueryValue);
  require(invalidValue.find("Jayess url setQuery expects a string value") != std::string::npos, "url setQuery value diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:url edge cases and invalid-input diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/url-hardening-main.js", "runtime-url-hardening", (_targetDir, entry) => urlMain(entry));
});
