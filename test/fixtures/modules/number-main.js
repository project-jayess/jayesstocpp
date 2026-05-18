import { parseFloat, parseInt } from "jayess:number";

export function run(integerText, floatText, badIntText, badFloatText) {
  return [
    parseInt(integerText),
    parseFloat(floatText),
    parseInt(badIntText),
    parseFloat(badFloatText)
  ];
}
