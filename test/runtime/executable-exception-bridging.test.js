import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function exceptionMain({ header, namespace }) {
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

std::string thrown_payload(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return std::string("std:") + error.what();
  }
  return "not-thrown";
}

std::string std_exception_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::string("jayess:") + std::get<std::string>(payload);
    }
    return "jayess:non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();

  auto jayessPayload = thrown_payload(${namespace}::throwJayess);
  require(jayessPayload == "jayess boom", "jayess thrown payload");

  auto nativeSync = std_exception_message(${namespace}::throwNativeSync);
  require(nativeSync.find("Unable to read file") != std::string::npos, "native sync std::exception");

  try {
    jayess::await_sync(${namespace}::throwNativeAsync(std::vector<jayess::value>{}));
    throw std::runtime_error("expected async native rejection");
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    require(std::holds_alternative<std::string>(payload), "native async bridged payload type");
    require(std::get<std::string>(payload).find("Unable to read file") != std::string::npos, "native async bridged payload");
  }

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ preserves Jayess throws and native exception bridging", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/exception-bridging-main.js", "runtime-exception-bridging", (_targetDir, entry) => exceptionMain(entry));
});
