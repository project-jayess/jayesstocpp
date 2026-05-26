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
  require(std::get<std::string>(items[10]) == "SubB", "certificate metadata subject");
  require(std::get<std::string>(items[11]) == "IssA", "certificate metadata issuer");
  require(std::get<std::string>(items[12]) == "2a", "certificate metadata serial");
  require(std::get<std::string>(items[13]) == "2024-01-01T00:00:00Z", "certificate validity start");
  require(std::get<std::string>(items[14]) == "2025-01-01T00:00:00Z", "certificate validity end");
  require(std::get<std::string>(items[15]) == "SubB", "certificate subject helper");
  require(std::get<std::string>(items[16]) == "IssA", "certificate issuer helper");
  require(std::get<std::string>(items[17]) == "2a", "certificate serial helper");
  require(std::get<std::string>(items[18]) == "2024-01-01T00:00:00Z", "certificate validity start helper");
  require(std::get<std::string>(items[19]) == "2025-01-01T00:00:00Z", "certificate validity end helper");
  require(std::get<std::string>(items[20]) == "pkcs8", "private key metadata kind");
  require(std::get<double>(items[21]) == 3.0, "private key metadata length");
  require(std::get<std::string>(items[22]) == "rsa", "rsa private key kind");
  require(std::get<double>(items[23]) == 3.0, "rsa private key length");
  require(std::get<std::string>(items[24]) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "certificate fingerprint");
  require(std::get<std::string>(items[25]) == "sha256", "certificate verification algorithm");
  require(std::get<std::string>(items[26]) == std::get<std::string>(items[24]), "certificate verification fingerprint");
  require(std::get<std::string>(items[27]) == "certificate", "certificate verification kind");

  auto invalidCertificate = thrown_message(${namespace}::invalidCertificateLabel);
  require(invalidCertificate.find("expects a CERTIFICATE block") != std::string::npos, "certificate label diagnostic");
  auto invalidPrivateKey = thrown_message(${namespace}::invalidPrivateKeyLabel);
  require(invalidPrivateKey.find("expects a PRIVATE KEY block") != std::string::npos, "private key label diagnostic");
  auto invalidPem = thrown_message(${namespace}::invalidPemInput);
  require(invalidPem.find("expects BEGIN/END blocks") != std::string::npos, "pem input diagnostic");
  auto invalidAnchors = thrown_message(${namespace}::invalidTrustAnchors);
  require(invalidAnchors.find("trust anchors must contain only certificates") != std::string::npos, "trust anchor diagnostic");
  auto invalidPrivateMetadata = thrown_message(${namespace}::invalidPrivateKeyMetadata);
  require(invalidPrivateMetadata.find("private key metadata expects a private key") != std::string::npos, "private key metadata diagnostic");
  auto unsupportedPrivateKey = thrown_message(${namespace}::unsupportedPrivateKeyAlgorithm);
  require(unsupportedPrivateKey.find("unsupported private key algorithm") != std::string::npos, "unsupported private key diagnostic");
  auto invalidFingerprint = thrown_message(${namespace}::invalidCertificateFingerprint);
  require(invalidFingerprint.find("fingerprint expects a certificate") != std::string::npos, "invalid fingerprint diagnostic");
  auto unsupportedFingerprint = thrown_message(${namespace}::unsupportedCertificateFingerprintAlgorithm);
  require(unsupportedFingerprint.find("unsupported algorithm") != std::string::npos, "unsupported fingerprint diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs crypto PEM container helpers and diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/crypto-pem-main.js", "runtime-crypto-pem", (_targetDir, entry) => cryptoPemMain(entry));
});
