import { create, exec, isRegex, test as regexTest } from "jayess:regex";

export function run(text) {
  var regex = create("a(b+)");
  return [isRegex(regex), regexTest(regex, text), exec(regex, text), exec(regex, "zzz")];
}
