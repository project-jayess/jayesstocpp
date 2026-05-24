#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessEncodingBase64Encode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_base64_encode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingBase64Decode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_base64_decode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingHexEncode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_hex_encode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingHexDecode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_hex_decode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingAsciiEncode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_ascii_encode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingAsciiDecode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_ascii_decode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingUtf16Encode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_utf16_encode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingUtf16Decode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_utf16_decode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingUriEncode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_uri_encode(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessEncodingUriDecode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::encoding_uri_decode(jayess::argument_at(jayessArgs, 0));
}
