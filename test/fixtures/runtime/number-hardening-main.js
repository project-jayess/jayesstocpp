import { isFinite, isInteger, parseFloat, parseInt } from "jayess:number";

export function inspect() {
  return [
    isInteger(1),
    isInteger(1.5),
    isFinite(2.5),
    isFinite("2.5"),
    parseInt("  +12  "),
    parseFloat(" -0.5e1 "),
    parseFloat("6e2"),
    parseInt(""),
    parseInt("12px"),
    parseFloat("1.5ms"),
    parseFloat("")
  ];
}

export function invalidParseInput() {
  return parseInt(1);
}

export function invalidParseFloatInput() {
  return parseFloat(false);
}
