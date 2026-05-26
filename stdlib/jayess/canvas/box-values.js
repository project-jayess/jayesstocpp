import { parseFloat } from "jayess:number";
import { slice, split, trim } from "jayess:string";

function fail(message) {
  throw message;
}

function parseSize(value) {
  var text = trim(value);
  if (text === "auto") {
    return null;
  }
  if (text.length > 2 && slice(text, text.length - 2, text.length) === "px") {
    text = slice(text, 0, text.length - 2);
  }
  var parsed = parseFloat(text);
  if (parsed === null) {
    fail("jayess:canvas css expected a numeric size");
  }
  return parsed;
}

function splitBoxParts(value) {
  var raw = split(trim(value), " ");
  var parts = [];
  for (var index = 0; index < raw.length; index = index + 1) {
    var part = trim(raw[index]);
    if (part !== "") {
      parts.push(part);
    }
  }
  if (parts.length < 1 || parts.length > 4) {
    fail("jayess:canvas css box shorthand expects one to four sizes");
  }
  return parts;
}

export function parseBoxValue(value) {
  var parts = splitBoxParts(value);
  var top = parseSize(parts[0]);
  var right = top;
  var bottom = top;
  var left = top;
  if (parts.length === 2) {
    right = parseSize(parts[1]);
    left = right;
  } else if (parts.length === 3) {
    right = parseSize(parts[1]);
    bottom = parseSize(parts[2]);
    left = right;
  } else if (parts.length === 4) {
    right = parseSize(parts[1]);
    bottom = parseSize(parts[2]);
    left = parseSize(parts[3]);
  }
  return {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  };
}

export function boxTop(value) {
  if (value === null) {
    return 0;
  }
  if (value.top !== null) {
    return value.top;
  }
  return value;
}

export function boxRight(value) {
  if (value === null) {
    return 0;
  }
  if (value.right !== null) {
    return value.right;
  }
  return value;
}

export function boxBottom(value) {
  if (value === null) {
    return 0;
  }
  if (value.bottom !== null) {
    return value.bottom;
  }
  return value;
}

export function boxLeft(value) {
  if (value === null) {
    return 0;
  }
  if (value.left !== null) {
    return value.left;
  }
  return value;
}

export function uniformBoxValue(value) {
  if (value === null) {
    return 0;
  }
  if (value.top !== null) {
    if (value.top === value.right && value.top === value.bottom && value.top === value.left) {
      return value.top;
    }
    return null;
  }
  return value;
}
