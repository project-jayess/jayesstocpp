import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function bytesBufferMain({ header, namespace }) {
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
  require(items.size() == 9, "bytes/buffer hardening result length");
  require(std::get<double>(items[0]) == 6.0, "bytes mutation aliases");
  require(std::get<double>(items[1]) == 1.0, "bytes slice copy");
  require(std::get<double>(items[2]) == 5.0, "buffer write mutates backing bytes");
  require(std::get<double>(items[3]) == 7.0, "buffer read copy");
  require(std::get<double>(items[4]) == 3.0, "bytes slice clamps end");
  require(std::get<double>(items[5]) == 0.0, "bytes slice empty when end before start");
  require(std::get<bool>(items[6]) == true, "buffer concat returns bytes-backed buffer");
  require(std::get<double>(items[7]) == 4.0, "buffer concat length");
  require(std::get<double>(items[8]) == 6.0, "buffer write second byte");

  auto invalidByte = thrown_message(${namespace}::invalidByteNumber);
  require(invalidByte.find("Jayess bytes fromArray expects byte numbers") != std::string::npos, "bytes invalid byte diagnostic");

  auto invalidIndex = thrown_message(${namespace}::invalidGetIndex);
  require(invalidIndex.find("Jayess bytes get index is out of range") != std::string::npos, "bytes get range diagnostic");

  auto invalidSlice = thrown_message(${namespace}::invalidSliceArity);
  require(invalidSlice.find("Jayess bytes slice expects at most one end argument") != std::string::npos, "bytes slice arity diagnostic");

  auto invalidBuffer = thrown_message(${namespace}::invalidBufferInput);
  require(invalidBuffer.find("jayess:buffer expected a jayess:bytes value") != std::string::npos, "buffer input diagnostic");

  auto invalidWrite = thrown_message(${namespace}::invalidBufferWriteRange);
  require(invalidWrite.find("jayess:buffer range is outside buffer bounds") != std::string::npos, "buffer write range diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:bytes and jayess:buffer mutation and bounds diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/bytes-buffer-hardening-main.js", "runtime-bytes-buffer-hardening", (_targetDir, entry) => bytesBufferMain(entry));
});
