import { keys } from "jayess:object";
import { split, trim } from "jayess:string";

function parseLine(line) {
  var cleaned = trim(line);
  if (cleaned.length === 0 || cleaned.startsWith("#")) {
    return null;
  }
  var equals = cleaned.indexOf("=");
  if (equals < 0) {
    return null;
  }
  return {
    key: trim(cleaned.slice(0, equals)),
    value: trim(cleaned.slice(equals + 1))
  };
}

export function parse(text) {
  var result = {};
  var lines = split(text, "\n");
  for (var index = 0; index < lines.length; index = index + 1) {
    var entry = parseLine(lines[index]);
    if (entry !== null && entry.key.length > 0) {
      result[entry.key] = entry.value;
    }
  }
  return result;
}

export function stringify(values) {
  var output = "";
  var first = true;
  var names = keys(values);
  for (var index = 0; index < names.length; index = index + 1) {
    var key = names[index];
    if (!first) {
      output = output + "\n";
    }
    output = output + key + "=" + values[key];
    first = false;
  }
  return output;
}
