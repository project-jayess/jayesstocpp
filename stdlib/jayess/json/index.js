import {
  jayessIsJsonText,
  jayessJsonParse,
  jayessJsonStringify,
  jayessJsonStringifyPretty,
  jayessJsonValidate
} from "./json-primitives.hpp";

export function parse(text) {
  return jayessJsonParse(text);
}

export function stringify(value) {
  return jayessJsonStringify(value);
}

export function stringifyPretty(value, indent) {
  return jayessJsonStringifyPretty(value, indent);
}

export function validate(text) {
  return jayessJsonValidate(text);
}

export function isJsonText(text) {
  return jayessIsJsonText(text);
}
