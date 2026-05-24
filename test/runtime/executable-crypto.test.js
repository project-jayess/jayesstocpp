import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function cryptoMain({ header, namespace }) {
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
  auto result = ${namespace}::run(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(result)->items;

  require(std::get<std::string>(items[0]) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "sha256 digest");
  require(std::get<std::string>(items[1]) == "a9993e364706816aba3e25717850c26c9cd0d89d", "sha1 digest");
  require(std::get<std::string>(items[2]) == "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f", "sha512 digest");
  require(std::get<std::string>(items[3]) == "9c196e32dc0175f86f4b1cb89289d6619de6bee699e4c378e68309ed97a1a6ab", "hmac sha256");
  require(std::get<std::string>(items[4]) == "4fd0b215276ef12f2b3e4c8ecac2811498b656fc", "hmac sha1");
  require(std::get<std::string>(items[5]) == "3926a207c8c42b0c41792cbd3e1a1aaaf5f7a25704f62dfc939c4987dd7ce060009c5bb1c2447355b3216f10b537e9afa7b64a4e5391b0d631172d07939e087a", "hmac sha512");
  require(std::get<std::string>(items[6]) == "9ca0d662557439e3b83365f2da4626d35da195c6d9d1779f09838cf9e408966ece99106e2585ace6f083", "hkdf sha256");
  require(std::get<bool>(items[7]) == true, "streaming hash");
  require(std::get<bool>(items[8]) == true, "secureEquals hmac");
  require(std::get<double>(items[9]) == 32.0, "random length");
  require(std::get<bool>(items[10]) == true, "repeat hash consistency");
  require(std::get<bool>(items[11]) == false, "random variability");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs crypto digests, hmac helpers, hkdf, and random byte generation", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/crypto-main.js", "runtime-crypto", (_targetDir, entry) => cryptoMain(entry));
});
