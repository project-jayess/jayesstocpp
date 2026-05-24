import { join } from "jayess:array";
import { keys } from "jayess:object";
import { startsWith, slice, split, trim } from "jayess:string";

function isComment(line) {
  return startsWith(line, "#") || startsWith(line, ";");
}

function sectionName(line) {
  if (startsWith(line, "[") && slice(line, line.length - 1, line.length) === "]") {
    return trim(slice(line, 1, line.length - 1));
  }
  return null;
}

export function parse(text) {
  var result = {};
  var current = result;
  var lines = split(text, "\n");
  for (var index = 0; index < lines.length; index = index + 1) {
    var line = trim(lines[index]);
    if (line.length === 0 || isComment(line)) {
      continue;
    }
    var name = sectionName(line);
    if (name !== null) {
      result[name] = {};
      current = result[name];
      continue;
    }
    var equals = line.indexOf("=");
    if (equals >= 0) {
      current[trim(slice(line, 0, equals))] = trim(slice(line, equals + 1, line.length));
    }
  }
  return result;
}

function stringifyPairs(values) {
  var names = keys(values);
  var lines = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    lines.push(name + "=" + values[name]);
  }
  return join(lines, "\n");
}

export function stringify(data) {
  var names = keys(data);
  var blocks = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    var body = stringifyPairs(data[name]);
    if (name.length === 0) {
      blocks.push(body);
    } else {
      blocks.push("[" + name + "]\n" + body);
    }
  }
  return join(blocks, "\n\n");
}
