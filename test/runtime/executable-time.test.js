import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function timeMain({ header, namespace }) {
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
  require(items.size() == 7, "time hardening result length");
  require(std::get<bool>(items[0]) == true, "time millis monotonic");
  require(std::get<bool>(items[1]) == true, "time elapsed non-negative");
  require(std::get<double>(items[2]) == 2500.0, "time seconds conversion");
  require(std::get<double>(items[3]) == 90000.0, "time minutes conversion");
  require(std::get<std::string>(items[4]) == "0ms", "time format zero");
  require(std::get<std::string>(items[5]) == "1m 1s 1ms", "time format mixed");
  require(std::get<std::string>(items[6]) == "-1s 500ms", "time format negative");

  auto invalidSeconds = thrown_message(${namespace}::invalidSecondsInput);
  require(invalidSeconds.find("Jayess time seconds expects a finite number") != std::string::npos, "time seconds diagnostic");

  auto invalidElapsed = thrown_message(${namespace}::invalidElapsedInput);
  require(invalidElapsed.find("Jayess time elapsed expects a finite start value") != std::string::npos, "time elapsed diagnostic");

  auto invalidFormat = thrown_message(${namespace}::invalidFormatInput);
  require(invalidFormat.find("Jayess time formatDuration expects finite milliseconds") != std::string::npos, "time format diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:time monotonic and duration semantics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/time-hardening-main.js", "runtime-time-hardening", (_targetDir, entry) => timeMain(entry));
});
