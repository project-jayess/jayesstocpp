import { parseFloat } from "jayess:number";
import { slice, startsWith, trim } from "jayess:string";

function fail(message) {
  throw message;
}

function endsWith(text, suffix) {
  if (text.length < suffix.length) {
    return false;
  }
  return slice(text, text.length - suffix.length, text.length) === suffix;
}

function numericText(text, unit) {
  if (unit.length === 0) {
    return text;
  }
  return slice(text, 0, text.length - unit.length);
}

function parseNumberPart(text, unit) {
  var parsed = parseFloat(numericText(text, unit));
  if (parsed === null) {
    fail("jayess:canvas css expected a valid " + unit + " size");
  }
  return parsed;
}

export function parseCssSize(value) {
  var text = trim(value);
  if (text === "auto") {
    return { kind: "auto", value: null };
  }
  if (startsWith(text, "calc(")) {
    fail("jayess:canvas css unsupported size unit: calc");
  }
  if (endsWith(text, "%")) {
    return { kind: "percent", value: parseNumberPart(text, "%") };
  }
  if (endsWith(text, "px")) {
    return { kind: "px", value: parseNumberPart(text, "px") };
  }
  if (endsWith(text, "em") || endsWith(text, "rem") || endsWith(text, "vh") || endsWith(text, "vw")) {
    fail("jayess:canvas css unsupported size unit");
  }
  var parsed = parseFloat(text);
  if (parsed === null) {
    fail("jayess:canvas css expected a numeric size");
  }
  return { kind: "px", value: parsed };
}

export function cssSizeKind(value) {
  if (value === null) {
    return "auto";
  }
  if (value.kind !== null) {
    return value.kind;
  }
  return "px";
}

export function cssSizeValue(value) {
  if (value === null) {
    return null;
  }
  if (value.kind !== null) {
    return value.value;
  }
  return value;
}
