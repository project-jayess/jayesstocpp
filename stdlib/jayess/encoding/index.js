import {
  jayessEncodingBase64Decode,
  jayessEncodingBase64Encode,
  jayessEncodingAsciiDecode,
  jayessEncodingAsciiEncode,
  jayessEncodingHexDecode,
  jayessEncodingHexEncode,
  jayessEncodingUtf16Decode,
  jayessEncodingUtf16Encode,
  jayessEncodingUriDecode,
  jayessEncodingUriEncode
} from "./encoding-primitives.hpp";

export function base64Encode(bytes) {
  return jayessEncodingBase64Encode(bytes);
}

export function base64Decode(text) {
  return jayessEncodingBase64Decode(text);
}

export function hexEncode(bytes) {
  return jayessEncodingHexEncode(bytes);
}

export function hexDecode(text) {
  return jayessEncodingHexDecode(text);
}

export function asciiEncode(text) {
  return jayessEncodingAsciiEncode(text);
}

export function asciiDecode(bytes) {
  return jayessEncodingAsciiDecode(bytes);
}

export function utf16Encode(text) {
  return jayessEncodingUtf16Encode(text);
}

export function utf16Decode(bytes) {
  return jayessEncodingUtf16Decode(bytes);
}

export function uriEncode(text) {
  return jayessEncodingUriEncode(text);
}

export function uriDecode(text) {
  return jayessEncodingUriDecode(text);
}
