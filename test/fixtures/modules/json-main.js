import { isJsonText, parse, stringify } from "jayess:json";

export function run(text) {
  if (isJsonText(text)) {
    return stringify(parse(text));
  }
  return "invalid";
}
