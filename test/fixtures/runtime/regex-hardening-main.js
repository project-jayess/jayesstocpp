import {
  create,
  exec,
  matchAll,
  replaceAll,
  replaceFirst,
  test as regexTest
} from "jayess:regex";

export function inspect() {
  var noMatch = create("z+");
  return [
    exec(noMatch, "abc"),
    matchAll(noMatch, "abc").length,
    replaceFirst(noMatch, "abc", "x"),
    replaceAll(noMatch, "abc", "x")
  ];
}

export function invalidPattern() {
  return regexTest(create("("), "");
}

export function invalidTextInput() {
  return regexTest(create("a"), 1);
}

export function invalidReplacementCallback() {
  return replaceAll(create("a"), "aba", function replacement() {
    return "x";
  });
}
