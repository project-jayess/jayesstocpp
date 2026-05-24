import { create, exec, isRegex, matchAll, replaceAll, replaceFirst, split, test as regexTest } from "jayess:regex";

export function run(text) {
  var regex = create("a(b+)");
  var caseInsensitive = create("hello", "i");
  var dotAll = create("a.b", "s");
  return [
    isRegex(regex),
    regexTest(regex, text),
    regexTest(caseInsensitive, "HELLO"),
    regexTest(dotAll, "a\nb"),
    exec(regex, text),
    exec(regex, "zzz"),
    split(create("-"), "a-b-c"),
    matchAll(create("a(b+)"), text),
    replaceFirst(regex, text, "x"),
    replaceAll(regex, text, "x")
  ];
}
