import {
  jayessIsJsonText,
  jayessJsonParse,
  jayessJsonStringify
} from "./json-primitives.hpp";

export function parse(text) {
  return jayessJsonParse(text);
}

export function stringify(value) {
  return jayessJsonStringify(value);
}

export function isJsonText(text) {
  return jayessIsJsonText(text);
}
