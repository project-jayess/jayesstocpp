import {
  endsWith,
  includes,
  indexOf,
  padEnd,
  padStart,
  repeat,
  replaceAll,
  replaceFirst,
  slice,
  split,
  startsWith,
  toLower,
  toUpper,
  trim
} from "jayess:string";
import { create as regexCreate } from "jayess:regex";

export function run(text) {
  return [
    trim(text),
    startsWith(text, " Jay"),
    endsWith(text, " "),
    includes(text, "ess"),
    indexOf(text, "ess"),
    slice(text, 1, 7),
    split("a,b,c", ","),
    replaceFirst("jayess jayess", "jayess", "native"),
    replaceAll("a-b-c", "-", "+"),
    replaceFirst("a1b", regexCreate("[0-9]"), "x"),
    replaceAll("a1b2", regexCreate("[0-9]"), "x"),
    padStart("7", 3, "0"),
    padEnd("7", 3, "0"),
    repeat("ha", 2),
    toLower("JAYESS"),
    toUpper("jayess")
  ];
}
