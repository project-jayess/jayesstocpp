#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessCompressDeflate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::compress_deflate(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessCompressInflate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::compress_inflate(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessCompressGzip(const std::vector<jayess::value>& jayessArgs) {
  return jayess::compress_gzip(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessCompressGunzip(const std::vector<jayess::value>& jayessArgs) {
  return jayess::compress_gunzip(jayess::argument_at(jayessArgs, 0));
}
