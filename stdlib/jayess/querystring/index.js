import { join } from "jayess:array";
import { has as objectHas, keys } from "jayess:object";
import { replaceAll, slice, split } from "jayess:string";

function decodePart(text) {
  return replaceAll(replaceAll(text, "+", " "), "%20", " ");
}

function encodePart(text) {
  return replaceAll(replaceAll(text, "%", "%25"), " ", "+");
}

function splitPair(part) {
  var equals = part.indexOf("=");
  if (equals < 0) {
    return { key: decodePart(part), value: "" };
  }
  return {
    key: decodePart(slice(part, 0, equals)),
    value: decodePart(slice(part, equals + 1, part.length))
  };
}

export function parse(text) {
  var result = {};
  var input = text;
  if (input.length > 0 && slice(input, 0, 1) === "?") {
    input = slice(input, 1, input.length);
  }
  if (input.length === 0) {
    return result;
  }
  var parts = split(input, "&");
  for (var index = 0; index < parts.length; index = index + 1) {
    if (parts[index].length === 0) {
      continue;
    }
    var pair = splitPair(parts[index]);
    result[pair.key] = pair.value;
  }
  return result;
}

export function stringify(values) {
  var names = keys(values);
  var parts = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    parts.push(encodePart(name) + "=" + encodePart(values[name]));
  }
  return join(parts, "&");
}

export function get(values, key) {
  if (!objectHas(values, key)) {
    return null;
  }
  return values[key];
}

export function set(values, key, value) {
  values[key] = value;
  return values;
}

export function has(values, key) {
  return objectHas(values, key);
}
