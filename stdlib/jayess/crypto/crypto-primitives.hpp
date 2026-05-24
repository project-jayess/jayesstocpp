#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessCryptoSha256(const std::vector<jayess::value>& jayessArgs) {
  return jayess::crypto_sha256(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessCryptoSha1(const std::vector<jayess::value>& jayessArgs) {
  return jayess::crypto_sha1(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessCryptoRandomBytes(const std::vector<jayess::value>& jayessArgs) {
  return jayess::crypto_random_bytes(jayess::argument_at(jayessArgs, 0));
}
