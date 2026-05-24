import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function cryptoPemMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;

  require(std::get<std::string>(items[0]) == "certificate", "certificate kind");
  require(std::get<std::string>(items[1]) == "CERTIFICATE", "certificate label");
  require(std::get<std::string>(items[2]) == "616263", "certificate der");
  require(std::get<std::string>(items[3]) == "privateKey", "private key kind");
  require(std::get<std::string>(items[4]) == "PRIVATE KEY", "private key label");
  require(std::get<std::string>(items[5]) == "6b6579", "private key der");
  require(std::get<double>(items[6]) == 2.0, "trust anchor count");
  require(std::get<std::string>(items[7]) == "certificate", "trust anchor kind");
  require(std::get<std::string>(items[8]) == "646566", "second trust anchor der");
  require(std::get<double>(items[9]) == 3.0, "trust anchor der length");

  auto invalidCertificate = thrown_message(${namespace}::invalidCertificateLabel);
  require(invalidCertificate.find("expects a CERTIFICATE block") != std::string::npos, "certificate label diagnostic");
  auto invalidPrivateKey = thrown_message(${namespace}::invalidPrivateKeyLabel);
  require(invalidPrivateKey.find("expects a PRIVATE KEY block") != std::string::npos, "private key label diagnostic");
  auto invalidPem = thrown_message(${namespace}::invalidPemInput);
  require(invalidPem.find("expects BEGIN/END blocks") != std::string::npos, "pem input diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs crypto PEM container helpers and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/crypto-pem-main.js", "runtime-crypto-pem", (_targetDir, entry) => cryptoPemMain(entry));
});
