import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function cryptoTrustMain({ header, namespace }) {
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
  auto result = ${namespace}::inspectCertificateTrust(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]) == "CERTIFICATE", "trust anchor lookup");
  require(std::get<bool>(items[1]) == true, "trust anchor missing lookup");
  require(std::get<bool>(items[2]) == true, "certificate currently valid");
  require(std::get<std::string>(items[3]) == "valid", "certificate valid reason");
  require(std::get<bool>(items[4]) == false, "certificate expired validity");
  require(std::get<std::string>(items[5]) == "expired", "certificate expired reason");
  require(std::get<std::string>(items[6]) == "certificate-chain-metadata", "chain metadata kind");
  require(std::get<bool>(items[7]) == false, "chain metadata not cryptographically verified");
  require(std::get<std::string>(items[8]) == "metadata-only", "chain metadata verification boundary");
  require(std::get<double>(items[9]) == 2.0, "chain metadata count");
  require(std::get<std::string>(items[10]) == "SubB", "chain metadata subject");
  require(std::get<std::string>(items[11]) == "sha256", "chain metadata algorithm");
  auto invalidTimestamp = thrown_message(${namespace}::invalidCertificateValidityTimestamp);
  require(invalidTimestamp.find("timestamp must be a non-empty ISO string") != std::string::npos, "validity timestamp diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs crypto certificate trust helpers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/crypto-trust-main.js", "runtime-crypto-trust", (_targetDir, entry) => cryptoTrustMain(entry));
});
