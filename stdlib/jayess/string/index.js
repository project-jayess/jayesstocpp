import {
  jayessStringEndsWith,
  jayessStringIncludes,
  jayessStringSlice,
  jayessStringSplit,
  jayessStringStartsWith,
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

export function slice(text, start, ...end) {
  return jayessStringSlice(text, start, end);
}

export function split(text, separator) {
  return jayessStringSplit(text, separator);
}
