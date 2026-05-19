import { endsWith, includes, slice, split, startsWith, trim } from "jayess:string";

export function run(text) {
  return [
    trim(text),
    startsWith(text, " Jay"),
    endsWith(text, " "),
    includes(text, "ess"),
    slice(text, 1, 7),
    split("a,b,c", ",")
  ];
}
