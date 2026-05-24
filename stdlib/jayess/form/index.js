import { get, parse, set, stringify } from "jayess:querystring";

export function parseUrlEncoded(text) {
  return parse(text);
}

export function stringifyUrlEncoded(values) {
  return stringify(values);
}

export function field(values, key) {
  return get(values, key);
}

export function setField(values, key, value) {
  return set(values, key, value);
}
