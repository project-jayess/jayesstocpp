import { includes as arrayIncludes } from "jayess:array";
import { parse as parseColor } from "jayess:color";
import { parseFloat } from "jayess:number";
import { keys } from "jayess:object";
import { endsWith, includes, slice, split, trim } from "jayess:string";

const forbiddenGeometryAttributes = [
  "x1",
  "y1",
  "x2",
  "y2",
  "x3",
  "y3",
  "radius",
  "radius-x",
  "radius-y"
];

function fail(message) {
  throw message;
}

function attributeValue(attributes, name, fallback) {
  var value = attributes[name];
  if (value === null) {
    return fallback;
  }
  return value;
}

function requireAttributeValue(attributes, name) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    fail("jayess:canvas XML missing required attribute " + name);
  }
  return value;
}

function parseNumberValue(value, label) {
  var parsed = parseFloat(trim(value));
  if (parsed === null) {
    fail("jayess:canvas XML " + label + " must be a number");
  }
  return parsed;
}

function requireNonNegative(value, label) {
  if (value < 0) {
    fail("jayess:canvas XML " + label + " must be non-negative");
  }
  return value;
}

function requireUnit(value, label) {
  if (value < 0 || value > 1) {
    fail("jayess:canvas XML " + label + " must be between 0 and 1");
  }
  return value;
}

function requireAngle(value, label) {
  if (value < 0 || value > 360) {
    fail("jayess:canvas XML " + label + " must be between 0 and 360");
  }
  return value;
}

function parseBooleanValue(value, label) {
  var normalized = trim(value);
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  fail("jayess:canvas XML " + label + " must be true or false");
}

function readPointNumber(text, state, label) {
  var start = state.index;
  while (state.index < text.length && !includes(",)", slice(text, state.index, state.index + 1))) {
    state.index = state.index + 1;
  }
  if (start === state.index) {
    fail("jayess:canvas XML points " + label + " is empty");
  }
  return parseNumberValue(slice(text, start, state.index), "points " + label);
}

function skipPointWhitespace(text, state) {
  while (state.index < text.length && includes(" \n\r\t", slice(text, state.index, state.index + 1))) {
    state.index = state.index + 1;
  }
}

function expectPointCharacter(text, state, character) {
  skipPointWhitespace(text, state);
  if (slice(text, state.index, state.index + 1) !== character) {
    fail("jayess:canvas XML points must use tuples like (10,10), (30,20)");
  }
  state.index = state.index + 1;
}

export function rejectForbiddenGeometryAttributes(attributes) {
  for (var index = 0; index < forbiddenGeometryAttributes.length; index = index + 1) {
    var name = forbiddenGeometryAttributes[index];
    if (attributes[name] !== null) {
      fail("jayess:canvas XML attribute " + name + " is not supported; use points, width, and height");
    }
  }
}

export function rejectUnknownAttributes(attributes, allowedAttributes, elementName) {
  var names = keys(attributes);
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    if (!arrayIncludes(allowedAttributes, name)) {
      fail("jayess:canvas XML unknown attribute " + name + " on <" + elementName + ">");
    }
  }
}

export function numberAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return parseNumberValue(value, name);
}

export function requiredNumberAttribute(attributes, name) {
  return parseNumberValue(requireAttributeValue(attributes, name), name);
}

export function sizeAttribute(attributes, name, fallback) {
  return requireNonNegative(numberAttribute(attributes, name, fallback), name);
}

export function requiredSizeAttribute(attributes, name) {
  return requireNonNegative(requiredNumberAttribute(attributes, name), name);
}

function parseLengthValue(value, label, basis) {
  var normalized = trim(value);
  if (endsWith(normalized, "%")) {
    var percentText = trim(slice(normalized, 0, normalized.length - 1));
    return requireNonNegative(parseNumberValue(percentText, label), label) * basis / 100;
  }
  return requireNonNegative(parseNumberValue(normalized, label), label);
}

export function lengthAttribute(attributes, name, fallback, basis) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return parseLengthValue(value, name, basis);
}

export function optionalLengthAttribute(attributes, name, basis) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return null;
  }
  return parseLengthValue(value, name, basis);
}

export function unitAttribute(attributes, name, fallback) {
  return requireUnit(numberAttribute(attributes, name, fallback), name);
}

export function angleAttribute(attributes, name, fallback) {
  return requireAngle(numberAttribute(attributes, name, fallback), name);
}

export function colorAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return parseColor(value);
}

function compactParts(value) {
  var raw = split(trim(value), " ");
  var parts = [];
  for (var index = 0; index < raw.length; index = index + 1) {
    var part = trim(raw[index]);
    if (part.length > 0) {
      parts.push(part);
    }
  }
  return parts;
}

export function shadowAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  var normalized = trim(value);
  if (normalized === "none" || normalized.length === 0) {
    return null;
  }
  var parts = compactParts(normalized);
  if (parts.length !== 3 && parts.length !== 4 && parts.length !== 5) {
    fail("jayess:canvas XML shadow must be: offsetX offsetY [blur] [spread] color");
  }
  var color = parseColor(parts[parts.length - 1]);
  var blur = 0;
  var spread = 0;
  if (parts.length >= 4) {
    blur = requireNonNegative(parseNumberValue(parts[2], "shadow blur"), "shadow blur");
  }
  if (parts.length === 5) {
    spread = requireNonNegative(parseNumberValue(parts[3], "shadow spread"), "shadow spread");
  }
  return {
    offsetX: parseNumberValue(parts[0], "shadow offsetX"),
    offsetY: parseNumberValue(parts[1], "shadow offsetY"),
    blurRadius: blur,
    spreadRadius: spread,
    color: color
  };
}

function cornerParts(value, label) {
  var parts = compactParts(value);
  if (parts.length < 1 || parts.length > 4) {
    fail("jayess:canvas XML " + label + " must have 1 to 4 numeric values");
  }
  return parts;
}

function cornerValue(parts, index, label) {
  return requireNonNegative(parseNumberValue(parts[index], label), label);
}

export function cornersAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  var parts = cornerParts(value, name);
  var topLeft = cornerValue(parts, 0, name);
  var topRight = topLeft;
  var bottomRight = topLeft;
  var bottomLeft = topLeft;
  if (parts.length === 2) {
    topRight = cornerValue(parts, 1, name);
    bottomLeft = topRight;
  } else if (parts.length === 3) {
    topRight = cornerValue(parts, 1, name);
    bottomRight = cornerValue(parts, 2, name);
  } else if (parts.length === 4) {
    topRight = cornerValue(parts, 1, name);
    bottomRight = cornerValue(parts, 2, name);
    bottomLeft = cornerValue(parts, 3, name);
  }
  return {
    topLeft: topLeft,
    topRight: topRight,
    bottomRight: bottomRight,
    bottomLeft: bottomLeft
  };
}


export function booleanAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return parseBooleanValue(value, name);
}

export function textAttribute(attributes, name, fallback) {
  return attributeValue(attributes, name, fallback);
}

function requireTextAlignX(value, label) {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be left, center, or right");
}

function requireTextAlignY(value, label) {
  if (value === "top" || value === "middle" || value === "bottom") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be top, middle, or bottom");
}

export function textAlignXAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextAlignX(trim(value), name);
}

export function textAlignYAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextAlignY(trim(value), name);
}

export function textAlignAttribute(attributes, fallbackX, fallbackY) {
  var horizontal = fallbackX;
  var vertical = fallbackY;
  var value = attributeValue(attributes, "text-align", null);
  if (value !== null) {
    var parts = compactParts(value);
    if (parts.length !== 1 && parts.length !== 2) {
      fail("jayess:canvas XML text-align must be: horizontal [vertical]");
    }
    horizontal = requireTextAlignX(parts[0], "text-align");
    if (parts.length === 2) {
      vertical = requireTextAlignY(parts[1], "text-align");
    }
  }
  horizontal = textAlignXAttribute(attributes, "text-align-x", horizontal);
  vertical = textAlignYAttribute(attributes, "text-align-y", vertical);
  return { x: horizontal, y: vertical };
}

function requireTextTransform(value, label) {
  if (value === "none" || value === "uppercase" || value === "lowercase") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be none, uppercase, or lowercase");
}

export function textTransformAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextTransform(trim(value), name);
}

function requireTextDecoration(value, label) {
  if (value === "none" || value === "underline" || value === "overline" || value === "line-through") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be none, underline, overline, or line-through");
}

export function textDecorationAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextDecoration(trim(value), name);
}

function requireTextOverflow(value, label) {
  if (value === "overflow" || value === "clip" || value === "ellipsis") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be overflow, clip, or ellipsis");
}

export function textOverflowAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextOverflow(trim(value), name);
}

function requireTextWrap(value, label) {
  if (value === "wrap" || value === "nowrap") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be wrap or nowrap");
}

export function textWrapAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireTextWrap(trim(value), name);
}

export function selectionAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  var normalized = trim(value);
  if (normalized === "none" || normalized.length === 0) {
    return null;
  }
  var parts = compactParts(normalized);
  if (parts.length !== 2) {
    fail("jayess:canvas XML " + name + " must be none or: start end");
  }
  var start = requireNonNegative(parseNumberValue(parts[0], name + " start"), name + " start");
  var end = requireNonNegative(parseNumberValue(parts[1], name + " end"), name + " end");
  if (end < start) {
    var previousStart = start;
    start = end;
    end = previousStart;
  }
  return {
    start: start,
    end: end
  };
}

function requireOverflow(value, label) {
  if (value === "visible" || value === "hidden" || value === "auto" || value === "scroll") {
    return value;
  }
  fail("jayess:canvas XML " + label + " must be visible, hidden, auto, or scroll");
}

export function overflowAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  return requireOverflow(trim(value), name);
}

export function scrollbarColorAttribute(attributes, name, fallback) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return fallback;
  }
  var parts = compactParts(value);
  if (parts.length !== 2) {
    fail("jayess:canvas XML " + name + " must be: thumbColor trackColor");
  }
  return {
    thumb: parseColor(parts[0]),
    track: parseColor(parts[1])
  };
}

export function pointAttribute(attributes, name, fallbackX, fallbackY) {
  var value = attributeValue(attributes, name, null);
  if (value === null) {
    return { x: fallbackX, y: fallbackY };
  }
  var state = { index: 0 };
  expectPointCharacter(value, state, "(");
  skipPointWhitespace(value, state);
  var x = readPointNumber(value, state, "x");
  expectPointCharacter(value, state, ",");
  skipPointWhitespace(value, state);
  var y = readPointNumber(value, state, "y");
  expectPointCharacter(value, state, ")");
  skipPointWhitespace(value, state);
  if (state.index !== value.length) {
    fail("jayess:canvas XML " + name + " must use one tuple like (10,10)");
  }
  return { x: x, y: y };
}

export function pointsAttribute(attributes, x, y) {
  var value = attributeValue(attributes, "points", "");
  if (trim(value).length === 0) {
    return [];
  }
  var points = [];
  var state = { index: 0 };
  while (state.index < value.length) {
    expectPointCharacter(value, state, "(");
    skipPointWhitespace(value, state);
    var pointX = readPointNumber(value, state, "x");
    expectPointCharacter(value, state, ",");
    skipPointWhitespace(value, state);
    var pointY = readPointNumber(value, state, "y");
    expectPointCharacter(value, state, ")");
    points.push({ x: x + pointX, y: y + pointY });
    skipPointWhitespace(value, state);
    if (state.index < value.length) {
      expectPointCharacter(value, state, ",");
      skipPointWhitespace(value, state);
    }
  }
  return points;
}
