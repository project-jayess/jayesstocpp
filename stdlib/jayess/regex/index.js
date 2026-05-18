import {
  jayessRegexCreate,
  jayessRegexExec,
  jayessRegexIsRegex,
  jayessRegexTest
} from "./regex-primitives.hpp";

export function create(pattern) {
  return jayessRegexCreate(pattern);
}

export function test(regex, text) {
  return jayessRegexTest(regex, text);
}

export function exec(regex, text) {
  return jayessRegexExec(regex, text);
}

export function isRegex(value) {
  return jayessRegexIsRegex(value);
}
