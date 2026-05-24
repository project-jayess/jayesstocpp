import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function subprocessMain({ header, namespace }) {
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
  auto streamResult = jayess::await_sync(${namespace}::streamCommand(std::vector<jayess::value>{}));
  const auto& streamItems = std::get<jayess::array_ptr>(streamResult)->items;
  require(std::get<std::string>(streamItems[0]) == "streamed", "stdout stream text");
  require(std::get<double>(streamItems[1]) == 0.0, "stdout stream exit");
  require(std::get<bool>(streamItems[2]) == true, "stdout stream ok");

  auto errorResult = jayess::await_sync(${namespace}::streamErrorCommand(std::vector<jayess::value>{}));
  const auto& errorItems = std::get<jayess::array_ptr>(errorResult)->items;
  require(std::get<std::string>(errorItems[0]) == "problem", "stderr stream text");
  require(std::get<double>(errorItems[1]) == 2.0, "stderr stream exit");
  require(std::get<bool>(errorItems[2]) == false, "stderr stream not ok");

  auto required = jayess::await_sync(${namespace}::requireCommand(std::vector<jayess::value>{}));
  require(std::get<std::string>(required) == "required", "requireSuccess result");

  auto timeoutResult = jayess::await_sync(${namespace}::timeoutCommand(std::vector<jayess::value>{}));
  const auto& timeoutItems = std::get<jayess::array_ptr>(timeoutResult)->items;
  require(std::get<bool>(timeoutItems[0]) == true, "timeout killed");
  require(std::get<bool>(timeoutItems[1]) == true, "timeout flag");
  require(std::get<bool>(timeoutItems[2]) == false, "timeout not ok");

  auto stdinBytesResult = jayess::await_sync(${namespace}::stdinBytesCommand(std::vector<jayess::value>{}));
  const auto& stdinBytesItems = std::get<jayess::array_ptr>(stdinBytesResult)->items;
  require(std::get<std::string>(stdinBytesItems[0]) == "bytes-in", "stdin bytes stdout");
  require(std::get<double>(stdinBytesItems[1]) == 0.0, "stdin bytes exit");
  require(std::get<bool>(stdinBytesItems[2]) == false, "stdin bytes timeout flag");

  auto completedResult = ${namespace}::completedJoinCommand(std::vector<jayess::value>{});
  const auto& completedItems = std::get<jayess::array_ptr>(completedResult)->items;
  require(std::get<std::string>(completedItems[0]) == "done", "completed stdout");
  require(std::get<double>(completedItems[1]) == 0.0, "completed exit");
  require(std::get<bool>(completedItems[2]) == true, "completed ok");

  auto killedResult = ${namespace}::killedJoinCommand(std::vector<jayess::value>{});
  const auto& killedItems = std::get<jayess::array_ptr>(killedResult)->items;
  require(std::get<bool>(killedItems[0]) == true, "killed process flag");
  require(std::get<bool>(killedItems[1]) == false, "killed process not ok");

  auto convenienceResult = jayess::await_sync(${namespace}::convenienceCommand(std::vector<jayess::value>{}));
  const auto& convenienceItems = std::get<jayess::array_ptr>(convenienceResult)->items;
  require(std::get<std::string>(convenienceItems[0]) == "text", "runText output");
  require(std::get<double>(convenienceItems[1]) == 5.0, "runBytes length");
  require(std::get<std::string>(convenienceItems[2]) == "jayess", "runJson value");
  require(std::get<std::string>(convenienceItems[3]) == "pipe", "spawnPipeline stdout");

  auto cancellableResult = jayess::await_sync(${namespace}::cancellableCommand(std::vector<jayess::value>{}));
  const auto& cancellableItems = std::get<jayess::array_ptr>(cancellableResult)->items;
  require(std::get<std::string>(cancellableItems[0]) == "token", "runWithCancellation output");
  require(std::get<std::string>(cancellableItems[1]) == "time", "runWithTimeout output");
  require(std::get<std::string>(cancellableItems[2]) == "both", "runWithTimeoutAndCancellation output");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs subprocess stream and result helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/subprocess-main.js", "runtime-subprocess-executable", (_targetDir, entry) => subprocessMain(entry));
});
