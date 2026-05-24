import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function stdlibMain({ header, namespace }, body) {
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

runtimeTest("generated C++ runs jayess:fs async default helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/fs-async-main.js", "runtime-fs-async-executable", (targetDir, entry) => stdlibMain(entry, `  auto result = jayess::await_sync(${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 7, "fs result length");
  require(std::get<std::string>(items[0]) == "Jayess", "fs read text");
  require(std::get<bool>(items[1]) == true, "fs exists result");
  require(std::get<bool>(items[2]) == true, "fs stat isFile");
  require(std::get<double>(items[3]) == 2.0, "fs entry count");
  require(std::get<std::string>(items[4]) == "Jayess", "fs read json");
  require(std::get<bool>(items[5]) == true, "fs temp directory");
  require(std::get<bool>(items[6]) == true, "fs temp file");`));
});

runtimeTest("generated C++ runs jayess:bytes with jayess:encoding", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/encoding-main.js", "runtime-bytes-encoding-executable", (_targetDir, entry) => stdlibMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 8, "encoding result length");
  require(std::get<std::string>(items[0]) == "SmF5ZXNz", "base64 encode");
  require(std::get<std::string>(items[1]) == "Jayess", "base64 decode");
  require(std::get<std::string>(items[2]) == "4a6179657373", "hex encode");
  require(std::get<std::string>(items[3]) == "Jayess", "hex decode");
  require(std::get<std::string>(items[4]) == "ASCII", "ascii round trip");
  require(std::get<std::string>(items[5]) == "Wide", "utf16 round trip");`));
});

runtimeTest("generated C++ runs jayess:events listener behavior", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/events-main.js", "runtime-events-executable", (_targetDir, entry) => stdlibMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(items.size() == 6, "events result length");
  require(std::get<std::string>(items[0]) == "first:A,second:A!", "events listener order");
  require(std::get<double>(items[1]) == 2.0, "events before count");
  require(std::get<double>(items[2]) == 2.0, "events emit count");
  require(std::get<double>(items[3]) == 1.0, "events once removal");
  require(std::get<double>(items[4]) == 0.0, "events off removal");
  require(std::get<double>(items[5]) == 0.0, "events final emit count");`));
});

runtimeTest("generated C++ runs jayess:fs Sync helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/fs-main.js", "runtime-fs-sync-executable", (targetDir, entry) => stdlibMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))});
  const auto text = std::get<std::string>(result);
  require(text.find("Jayess") != std::string::npos, "fs sync read text");
  require(text.find("true") != std::string::npos, "fs sync boolean data");
  require(text.find("Child") != std::string::npos, "fs sync recursive copy");
  require(text.find("Jayess") != std::string::npos, "fs sync json data");
  require(text.find("true") != std::string::npos, "fs sync temp file suffix");`));
});

runtimeTest("generated C++ runs jayess:stream read/write/copy helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/stream-main.js", "runtime-stream-executable", (targetDir, entry) => stdlibMain(entry, `  auto result = jayess::await_sync(${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "Jayess", "stream chunk text");
  require(std::get<std::string>(items[1]) == "Jayess", "stream copied text");
  require(std::get<std::string>(items[2]) == "Jayess", "stream all text");
  require(std::get<double>(items[3]) == 64.0, "stream hash digest length");
  require(std::get<std::string>(items[4]) == "onetwo", "stream first line");
  require(std::get<std::string>(items[5]) == "", "stream trailing line");
  require(std::get<std::string>(items[6]) == "onetwo\\n", "stream pipe text");
  require(std::get<std::string>(items[7]) == "Jayess", "stream tee text");
  require(std::get<std::string>(items[8]) == "Jayess", "stream collect text");
  require(std::get<std::string>(items[9]) == "Jayess", "stream collect bytes");
  require(std::get<std::string>(items[10]) == "Jayess", "stream pipeAll text");
  require(std::get<std::string>(items[11]) == "Jayess", "stream toText alias");
  require(std::get<std::string>(items[12]) == "Jayess", "stream toBytes alias");`));
});

runtimeTest("generated C++ runs jayess:csv, jayess:ini, and jayess:glob helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/text-file-stdlib-main.js", "runtime-text-file-stdlib-executable", (targetDir, entry) => stdlibMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{jayess::value(std::string(${JSON.stringify(targetDir)}))});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "one, two", "csv quoted parse");
  require(std::get<std::string>(items[1]).find("\\\"one, two\\\"") != std::string::npos, "csv quoted stringify");
  require(std::get<std::string>(items[2]) == "localhost", "ini section parse");
  require(std::get<std::string>(items[3]).find("[server]") != std::string::npos, "ini section stringify");
  require(std::get<bool>(items[4]) == true, "glob match");
  require(std::get<double>(items[5]) == 1.0, "glob count");`));
});

runtimeTest("generated C++ runs jayess:timers sleep and timeout helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/timers-main.js", "runtime-timers-executable", (_targetDir, entry) => stdlibMain(entry, `  auto result = jayess::await_sync(${entry.namespace}::run(std::vector<jayess::value>{jayess::value(4.0)}));
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 5.0, "timer callback result");
  require(std::holds_alternative<std::monostate>(items[1]), "cleared timer result");`));
});

runtimeTest("generated C++ runs jayess:thread spawn and join helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/thread-main.js", "runtime-thread-executable", (_targetDir, entry) => stdlibMain(entry, `  auto result = ${entry.namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 3.0, "thread join result");
  require(std::get<double>(items[1]) >= 1.0, "thread hardware concurrency");
  require(std::get<std::string>(items[2]).size() > 0, "thread current id");`));
});
