import {
  jayessBytesCompare,
  jayessBytesConcat,
  jayessBytesEndsWith,
  jayessBytesEquals,
  jayessBytesSecureEquals,
  jayessBytesFill,
  jayessBytesFromArray,
  jayessBytesFromUtf8,
  jayessBytesGet,
  jayessBytesIsBytes,
  jayessBytesLength,
  jayessBytesSet,
  jayessBytesSlice,
  jayessBytesStartsWith,
  jayessBytesToArray,
  jayessBytesToUtf8
} from "./bytes-primitives.hpp";

export function fromUtf8(text) {
  return jayessBytesFromUtf8(text);
}

export function fromArray(values) {
  return jayessBytesFromArray(values);
}

export function toArray(bytes) {
  return jayessBytesToArray(bytes);
}

export function toUtf8(bytes) {
  return jayessBytesToUtf8(bytes);
}

export function length(bytes) {
  return jayessBytesLength(bytes);
}

export function get(bytes, index) {
  return jayessBytesGet(bytes, index);
}

export function set(bytes, index, value) {
  return jayessBytesSet(bytes, index, value);
}

export function fill(bytes, value) {
  return jayessBytesFill(bytes, value);
}

export function slice(bytes, start, ...end) {
  return jayessBytesSlice(bytes, start, end);
}

export function concat(left, right) {
  return jayessBytesConcat(left, right);
}

export function equals(left, right) {
  return jayessBytesEquals(left, right);
}

export function secureEquals(left, right) {
  return jayessBytesSecureEquals(left, right);
}

export function compare(left, right) {
  return jayessBytesCompare(left, right);
}

export function startsWith(bytes, prefix) {
  return jayessBytesStartsWith(bytes, prefix);
}

export function endsWith(bytes, suffix) {
  return jayessBytesEndsWith(bytes, suffix);
}

export function isBytes(value) {
  return jayessBytesIsBytes(value);
}
