import {
  jayessStringEndsWith,
  jayessStringIncludes,
  jayessStringIndexOf,
  jayessStringPadEnd,
  jayessStringPadStart,
  jayessStringRepeat,
  jayessStringReplaceAll,
  jayessStringReplaceFirst,
  jayessStringSlice,
  jayessStringSplit,
  jayessStringStartsWith,
  jayessStringToLower,
  jayessStringToUpper,
  jayessStringTrim
} from "./string-primitives.hpp";

export function trim(text) {
  return jayessStringTrim(text);
}

export function startsWith(text, prefix) {
  return jayessStringStartsWith(text, prefix);
}

export function endsWith(text, suffix) {
  return jayessStringEndsWith(text, suffix);
}

export function includes(text, needle) {
  return jayessStringIncludes(text, needle);
}

export function indexOf(text, needle) {
  return jayessStringIndexOf(text, needle);
}

export function slice(text, start, ...end) {
  return jayessStringSlice(text, start, end);
}

export function split(text, separator) {
  return jayessStringSplit(text, separator);
}

export function replaceFirst(text, search, replacement) {
  return jayessStringReplaceFirst(text, search, replacement);
}

export function replaceAll(text, search, replacement) {
  return jayessStringReplaceAll(text, search, replacement);
}

export function padStart(text, length, ...fill) {
  return jayessStringPadStart(text, length, fill);
}

export function padEnd(text, length, ...fill) {
  return jayessStringPadEnd(text, length, fill);
}

export function repeat(text, count) {
  return jayessStringRepeat(text, count);
}

export function toLower(text) {
  return jayessStringToLower(text);
}

export function toUpper(text) {
  return jayessStringToUpper(text);
}
