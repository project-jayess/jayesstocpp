import {
  endsWith,
  includes,
  indexOf,
  padEnd,
  padStart,
  repeat,
  slice,
  split,
  startsWith,
  trim
} from "jayess:string";

export function inspect() {
  var splitResult = split("a,,b", ",");
  return [
    trim(""),
    startsWith("", ""),
    endsWith("", ""),
    includes("", ""),
    indexOf("", ""),
    slice("", 0),
    split("", "").length,
    splitResult.length,
    splitResult[1],
    padStart("7", 1, "0"),
    padEnd("7", 1, "0"),
    repeat("ha", 0)
  ];
}

export function invalidIncludesNeedle() {
  return includes("jayess", 1);
}

export function invalidPadEndArity() {
  return padEnd("x", 3, ".", "!");
}
