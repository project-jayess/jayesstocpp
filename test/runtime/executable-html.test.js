import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function htmlMain({ header, namespace }) {
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

bool contains(const std::string& text, const std::string& needle) {
  return text.find(needle) != std::string::npos;
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess &lt;native&gt; &amp; C++", "escaped text");
  require(std::get<std::string>(items[1]) == "&quot;quoted&quot; &amp; &#39;single&#39;", "escaped attr");
  require(std::get<std::string>(items[2]) == "abc", "fragment");
  require(contains(std::get<std::string>(items[3]), "href=\\"/docs?q=Jayess &amp; C++\\""), "href attr");
  require(contains(std::get<std::string>(items[3]), ">Read &lt;docs&gt;</a>"), "link child");
  require(contains(std::get<std::string>(items[4]), "<section id=\\"intro\\">"), "section open");
  require(contains(std::get<std::string>(items[4]), "<h1>Jayess</h1>"), "heading child");

  try {
    ${namespace}::invalidTag(std::vector<jayess::value>{});
    require(false, "invalid tag should throw");
  } catch (const jayess::thrown_value& error) {
    require(contains(std::get<std::string>(error.value), "tag name"), "tag diagnostic");
  }

  try {
    ${namespace}::invalidAttribute(std::vector<jayess::value>{});
    require(false, "invalid attribute should throw");
  } catch (const jayess::thrown_value& error) {
    require(contains(std::get<std::string>(error.value), "attribute name"), "attribute diagnostic");
  }

  try {
    ${namespace}::invalidChild(std::vector<jayess::value>{});
    require(false, "invalid child should throw");
  } catch (const jayess::thrown_value& error) {
    require(contains(std::get<std::string>(error.value), "child value"), "child diagnostic");
  }

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:html helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/html-main.js", "runtime-html", (_targetDir, entry) => htmlMain(entry));
});
