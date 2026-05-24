import { join } from "jayess:array";
import { keys } from "jayess:object";
import { parseFloat } from "jayess:number";
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

function isSection(line) {
  return startsWith(line, "[") && slice(line, line.length - 1, line.length) === "]";
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
  if (startsWith(value, "\"")) {
    return unquote(value);
  }
  return parseFloat(value);
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
  if (startsWith(value, "[")) {
    return parseArray(value);
  }
  return parseScalar(value);
}

function assignDotted(target, key, value) {
  var parts = split(key, ".");
  var current = target;
  for (var index = 0; index < parts.length - 1; index = index + 1) {
    var name = trim(parts[index]);
    if (current[name] === null) {
      current[name] = {};
    }
    current = current[name];
  }
  current[trim(parts[parts.length - 1])] = value;
}

export function parse(text) {
  var result = {};
  var current = result;
  var lines = split(text, "\n");
  for (var index = 0; index < lines.length; index = index + 1) {
    var line = stripComment(lines[index]);
    if (line.length === 0) {
      continue;
    }
    if (isSection(line)) {
      var section = trim(slice(line, 1, line.length - 1));
      result[section] = {};
      current = result[section];
      continue;
    }
    var equals = line.indexOf("=");
    if (equals >= 0) {
      assignDotted(current, trim(slice(line, 0, equals)), parseValue(slice(line, equals + 1, line.length)));
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
  return "\"" + value.toString() + "\"";
}

function stringifyPairs(values) {
  var names = keys(values);
  var lines = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    lines.push(name + " = " + formatValue(values[name]));
  }
  return join(lines, "\n");
}

export function stringify(data) {
  var names = keys(data);
  var blocks = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    blocks.push("[" + name + "]\n" + stringifyPairs(data[name]));
  }
  return join(blocks, "\n\n");
}
