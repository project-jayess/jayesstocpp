import { split, trim } from "jayess:string";
import { parseCssSize } from "./css-values.js";

function fail(message) {
  throw message;
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
  var top = parseCssSize(parts[0]);
  var right = top;
  var bottom = top;
  var left = top;
  if (parts.length === 2) {
    right = parseCssSize(parts[1]);
    left = right;
  } else if (parts.length === 3) {
    right = parseCssSize(parts[1]);
    bottom = parseCssSize(parts[2]);
    left = right;
  } else if (parts.length === 4) {
    right = parseCssSize(parts[1]);
    bottom = parseCssSize(parts[2]);
    left = parseCssSize(parts[3]);
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
