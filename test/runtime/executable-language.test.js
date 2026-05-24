import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function languageMain({ header, namespace }, body) {
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
${body}
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs generator resume behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/generator-resume-main.js", "runtime-generator-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 4, "generator result length");
  require(std::get<std::string>(items[0]) == "Jay", "first yield");
  require(std::get<std::string>(items[1]) == "ess", "second yield");
  require(jayess::is_null(items[2]), "completed generator next");
  require(std::get<double>(items[3]) == 2.0, "generator toArray length");`));
});

runtimeTest("generated C++ runs generator try/finally multi-yield resume behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/generator-try-finally-main.js", "runtime-generator-try-finally-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 3, "generator try finally result length");
  require(std::get<double>(items[0]) == 2.0, "generator try finally first yield");
  require(std::get<double>(items[1]) == 4.0, "generator try finally second yield");
  require(std::get<double>(items[2]) == 11.0, "generator try finally completion");`));
});

runtimeTest("generated C++ runs generator try/catch catch-body yield behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/generator-try-catch-main.js", "runtime-generator-try-catch-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 2, "generator try catch result length");
  require(std::get<double>(items[0]) == 5.0, "generator catch first yield");
  require(std::get<double>(items[1]) == 6.0, "generator catch completion");`));
});

runtimeTest("generated C++ runs generator conditional expression-yield behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/generator-conditional-main.js", "runtime-generator-conditional-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 4, "generator conditional result length");
  require(std::get<std::string>(items[0]) == "left", "generator conditional left yield");
  require(std::get<std::string>(items[1]) == "right", "generator conditional right yield");
  require(std::get<std::string>(items[2]) == "done-left", "generator conditional left completion");
  require(std::get<std::string>(items[3]) == "done-right", "generator conditional right completion");`));
});

runtimeTest("generated C++ runs class inheritance and super", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/class-super-main.js", "runtime-class-super-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  require(std::get<std::string>(result) == "Jayess!", "class super result");`));
});

runtimeTest("generated C++ runs inherited class static initialization order", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/class-static-inheritance-main.js", "runtime-class-static-inheritance-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  require(std::get<std::string>(result) == "Jayess!", "class static inheritance result");`));
});

runtimeTest("generated C++ runs deeper inherited static lookup chains", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/class-static-chain-main.js", "runtime-class-static-chain-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  require(std::get<std::string>(result) == "Jayess!", "class static chain result");`));
});

runtimeTest("generated C++ runs computed static super reads and calls across deeper chains", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/class-static-super-computed-main.js", "runtime-class-static-super-computed-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess!", "computed static super read");
  require(std::get<std::string>(items[1]) == "Jayess!", "computed static super call");`));
});

runtimeTest("generated C++ preserves private static boundaries across inheritance", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/class-private-static-boundary-main.js", "runtime-class-private-static-boundary-executable", (_targetDir, entry) => languageMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "base", "base private static");
  require(std::get<std::string>(items[1]) == "child", "child private static");
  require(std::get<std::string>(items[2]) == "base:child", "private static boundary");`));
});
