import { isJsonText, parse, stringify, stringifyPretty, validate } from "jayess:json";

export function run(text) {
  if (isJsonText(text)) {
    var value = parse(text);
    return [stringify(value), stringifyPretty(value, 2), validate(text)];
  }
  return validate(text);
}
