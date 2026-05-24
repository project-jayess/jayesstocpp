import { floor, round } from "jayess:math";
import { parseFloat } from "jayess:number";
import { endsWith, indexOf, slice, split, startsWith, toLower, trim } from "jayess:string";

function fail(message) {
  throw message;
}

function makeColor(red, green, blue, alpha) {
  return {
    red: red,
    green: green,
    blue: blue,
    alpha: alpha
  };
}

function requireByte(name, value) {
  var rounded = round(value);
  if (rounded !== value || value < 0 || value > 255) {
    fail("jayess:color " + name + " channel must be an integer between 0 and 255");
  }
  return rounded;
}

function requireAlpha(alpha) {
  if (alpha < 0 || alpha > 1) {
    fail("jayess:color alpha must be between 0 and 1");
  }
  return alpha;
}

function makeRgba(red, green, blue, alpha) {
  return makeColor(
    requireByte("red", red),
    requireByte("green", green),
    requireByte("blue", blue),
    requireAlpha(alpha)
  );
}

function makeRgb(red, green, blue) {
  return makeRgba(red, green, blue, 1);
}

function requireAmount(amount) {
  if (amount < 0 || amount > 1) {
    fail("jayess:color mix amount must be between 0 and 1");
  }
  return amount;
}

function requireColor(value) {
  if (value === null) {
    fail("jayess:color expected a color object");
  }
  return makeRgba(value.red, value.green, value.blue, value.alpha);
}

function parseNumber(text) {
  var value = parseFloat(trim(text));
  if (value === null) {
    fail("jayess:color could not parse numeric color component");
  }
  return value;
}

function hexValue(character) {
  var digits = "0123456789abcdef";
  var index = indexOf(digits, toLower(character));
  if (index < 0) {
    fail("jayess:color invalid hexadecimal color input");
  }
  return index;
}

function parseShortHex(text) {
  return makeRgb(
    hexValue(slice(text, 1, 2)) * 17,
    hexValue(slice(text, 2, 3)) * 17,
    hexValue(slice(text, 3, 4)) * 17
  );
}

function parseHexByte(text, offset) {
  return hexValue(slice(text, offset, offset + 1)) * 16 + hexValue(slice(text, offset + 1, offset + 2));
}

function parseLongHex(text) {
  return makeRgb(
    parseHexByte(text, 1),
    parseHexByte(text, 3),
    parseHexByte(text, 5)
  );
}

function parseHex(text) {
  if (text.length === 4) {
    return parseShortHex(text);
  }
  if (text.length === 7) {
    return parseLongHex(text);
  }
  fail("jayess:color expected #rgb or #rrggbb input");
}

function parseFunctional(text, name, expectedParts) {
  var prefix = name + "(";
  if (!startsWith(text, prefix) || !endsWith(text, ")")) {
    fail("jayess:color invalid " + name + " color input");
  }

  var body = slice(text, prefix.length, text.length - 1);
  var parts = split(body, ",");
  if (parts.length !== expectedParts) {
    fail("jayess:color " + name + " input has an invalid component count");
  }

  if (expectedParts === 3) {
    return makeRgb(parseNumber(parts[0]), parseNumber(parts[1]), parseNumber(parts[2]));
  }
  return makeRgba(parseNumber(parts[0]), parseNumber(parts[1]), parseNumber(parts[2]), parseNumber(parts[3]));
}

function hexDigit(value) {
  return slice("0123456789abcdef", value, value + 1);
}

function byteToHex(value) {
  var high = floor(value / 16);
  var low = value - high * 16;
  return hexDigit(high) + hexDigit(low);
}

function interpolateByte(left, right, amount) {
  return round(left + (right - left) * amount);
}

export function rgba(red, green, blue, alpha) {
  return makeRgba(red, green, blue, alpha);
}

export function rgb(red, green, blue) {
  return makeRgb(red, green, blue);
}

export function parse(text) {
  var normalized = trim(text);
  var lower = toLower(normalized);

  if (startsWith(lower, "#")) {
    return parseHex(lower);
  }
  if (startsWith(lower, "rgba(")) {
    return parseFunctional(lower, "rgba", 4);
  }
  if (startsWith(lower, "rgb(")) {
    return parseFunctional(lower, "rgb", 3);
  }
  fail("jayess:color could not parse color input");
}

export function toHex(color) {
  var normalized = requireColor(color);
  return "#" + byteToHex(normalized.red) + byteToHex(normalized.green) + byteToHex(normalized.blue);
}

export function withAlpha(color, alpha) {
  var normalized = requireColor(color);
  return makeRgba(normalized.red, normalized.green, normalized.blue, alpha);
}

export function mix(left, right, amount) {
  var leftColor = requireColor(left);
  var rightColor = requireColor(right);
  var normalizedAmount = requireAmount(amount);
  return makeRgba(
    interpolateByte(leftColor.red, rightColor.red, normalizedAmount),
    interpolateByte(leftColor.green, rightColor.green, normalizedAmount),
    interpolateByte(leftColor.blue, rightColor.blue, normalizedAmount),
    leftColor.alpha + (rightColor.alpha - leftColor.alpha) * normalizedAmount
  );
}

export function lighten(color, amount) {
  return mix(color, makeRgb(255, 255, 255), amount);
}

export function darken(color, amount) {
  return mix(color, makeRgb(0, 0, 0), amount);
}
