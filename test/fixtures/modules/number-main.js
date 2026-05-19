import { isFinite, isInteger, parseFloat, parseInt } from "jayess:number";

export function run(integerText, floatText, badIntText, badFloatText) {
  return [
    isInteger(1),
    isFinite(2.5),
    parseInt(integerText),
    parseFloat(floatText),
    parseInt(badIntText),
    parseFloat(badFloatText)
  ];
}
