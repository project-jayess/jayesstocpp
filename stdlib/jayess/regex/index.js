import {
  jayessRegexCreate,
  jayessRegexExec,
  jayessRegexIsRegex,
  jayessRegexMatchAll,
  jayessRegexReplaceAll,
  jayessRegexReplaceFirst,
  jayessRegexSplit,
  jayessRegexTest
} from "./regex-primitives.hpp";

export function create(pattern, ...flags) {
  return jayessRegexCreate(pattern, flags);
}

export function test(regex, text) {
  return jayessRegexTest(regex, text);
}

export function exec(regex, text) {
  return jayessRegexExec(regex, text);
}

export function split(regex, text) {
  return jayessRegexSplit(regex, text);
}

export function matchAll(regex, text) {
  return jayessRegexMatchAll(regex, text);
}

export function replaceFirst(regex, text, replacement) {
  return jayessRegexReplaceFirst(regex, text, replacement);
}

export function replaceAll(regex, text, replacement) {
  return jayessRegexReplaceAll(regex, text, replacement);
}

export function isRegex(value) {
  return jayessRegexIsRegex(value);
}
