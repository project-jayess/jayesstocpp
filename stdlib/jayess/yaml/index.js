import { join } from "jayess:array";
import { parseFloat } from "jayess:number";
import { keys } from "jayess:object";
import { startsWith, slice, split, trim } from "jayess:string";

function stripComment(line) {
  var quoted = false;
  for (var index = 0; index < line.length; index = index + 1) {
    var current = slice(line, index, index + 1);
    if (current === "\"") {
      quoted = !quoted;
    } else if (!quoted && current === "#") {
      return trim(slice(line, 0, index));
    }
  }
  return trim(line);
}

function unquote(text) {
  var value = trim(text);
  if (startsWith(value, "\"") && slice(value, value.length - 1, value.length) === "\"") {
    return slice(value, 1, value.length - 1);
  }
  return value;
}

function parseScalar(text) {
  var value = trim(text);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  if (startsWith(value, "\"")) {
    return unquote(value);
  }
  var number = parseFloat(value);
  if (number !== null) {
    return number;
  }
  return value;
}

function parseArray(text) {
  var body = trim(slice(text, 1, text.length - 1));
  var values = [];
  if (body.length === 0) {
    return values;
  }
  var parts = split(body, ",");
  for (var index = 0; index < parts.length; index = index + 1) {
    values.push(parseScalar(parts[index]));
  }
  return values;
}

function parseValue(text) {
  var value = trim(text);
  if (startsWith(value, "[") && slice(value, value.length - 1, value.length) === "]") {
    return parseArray(value);
  }
  return parseScalar(value);
}

function assignPair(target, line) {
  var colon = line.indexOf(":");
  if (colon <= 0) {
    throw "jayess:yaml mapping line must contain a key followed by ':'";
  }
  var key = trim(slice(line, 0, colon));
  if (key.length === 0) {
    throw "jayess:yaml mapping key must not be empty";
  }
  var value = trim(slice(line, colon + 1, line.length));
  if (value.length === 0) {
    target[key] = {};
    return target[key];
  }
  target[key] = parseValue(value);
  return target;
}

export function parse(text) {
  var result = {};
  var current = result;
  var lines = split(text, "\n");
  for (var index = 0; index < lines.length; index = index + 1) {
    var raw = lines[index];
    var line = stripComment(raw);
    if (line.length === 0) {
      continue;
    }
    if (startsWith(raw, "  ")) {
      assignPair(current, line);
    } else {
      current = assignPair(result, line);
    }
  }
  return result;
}

function formatValue(value) {
  if (value === true) {
    return "true";
  }
  if (value === false) {
    return "false";
  }
  if (value === null) {
    return "null";
  }
  return value.toString();
}

function stringifyPairs(values) {
  var names = keys(values);
  var lines = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    lines.push("  " + name + ": " + formatValue(values[name]));
  }
  return join(lines, "\n");
}

export function stringify(data) {
  var names = keys(data);
  var blocks = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    blocks.push(name + ":\n" + stringifyPairs(data[name]));
  }
  return join(blocks, "\n");
}
