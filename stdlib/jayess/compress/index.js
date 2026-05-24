import {
  jayessCompressDeflate,
  jayessCompressGzip,
  jayessCompressGunzip,
  jayessCompressInflate
} from "./compress-primitives.hpp";

export function deflate(bytes) {
  return jayessCompressDeflate(bytes);
}

export function inflate(bytes) {
  return jayessCompressInflate(bytes);
}

export function gzip(bytes) {
  return jayessCompressGzip(bytes);
}

export function gunzip(bytes) {
  return jayessCompressGunzip(bytes);
}
