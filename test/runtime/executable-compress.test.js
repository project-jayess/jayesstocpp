import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function compressMain({ header, namespace }) {
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
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto roundTrip = ${namespace}::roundTrip(std::vector<jayess::value>{});
  require(std::get<bool>(roundTrip), "compress round trip");
  auto inflateError = thrown_message(${namespace}::badInflate);
  require(inflateError.find("malformed deflate") != std::string::npos, "compress inflate diagnostic");
  auto gunzipError = thrown_message(${namespace}::badGunzip);
  require(gunzipError.find("malformed gzip") != std::string::npos, "compress gunzip diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs compress round trips and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/compress-main.js", "runtime-compress", (_targetDir, entry) => compressMain(entry));
});
