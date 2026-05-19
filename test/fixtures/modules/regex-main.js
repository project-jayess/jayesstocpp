import { create, exec, isRegex, replaceAll, replaceFirst, test as regexTest } from "jayess:regex";

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
    replaceFirst(regex, text, "x"),
    replaceAll(regex, text, "x")
  ];
}
