import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function markupDataMain({ header, namespace }) {
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
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "note", "xml root");
  require(std::get<std::string>(items[1]) == "high", "xml attribute");
  require(std::get<std::string>(items[2]) == "title", "xml child");
  require(std::get<std::string>(items[3]) == "Native C++", "xml text");
  require(std::get<std::string>(items[4]) == "<message from=\\"jayess\\">Hello &lt;native&gt;</message>", "xml stringify");
  require(std::get<std::string>(items[5]) == "jayess", "yaml string");
  require(std::get<bool>(items[6]) == true, "yaml bool");
  require(std::get<double>(items[7]) == 3.0, "yaml number");
  require(std::get<std::string>(items[8]) == "cpp", "yaml array");
  require(std::get<bool>(items[9]) == true, "yaml stringify");
  require(std::get<std::string>(items[10]) == "heading", "markdown token");
  require(std::get<double>(items[11]) == 1.0, "markdown heading level");
  require(std::get<std::string>(items[12]) == "code", "markdown code token");
  require(std::get<bool>(items[13]) == true, "markdown heading html");
  require(std::get<bool>(items[14]) == true, "markdown link html");
  require(std::get<bool>(items[15]) == true, "markdown list html");
  require(thrown_message(${namespace}::invalidXml).find("closing tag") != std::string::npos, "xml diagnostic");
  require(thrown_message(${namespace}::invalidYaml).find("mapping line") != std::string::npos, "yaml diagnostic");
  require(thrown_message(${namespace}::invalidMarkdown).find("code fence") != std::string::npos, "markdown diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs markup and data standard-library helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/markup-data-main.js", "runtime-markup-data", (_targetDir, entry) => markupDataMain(entry));
});
