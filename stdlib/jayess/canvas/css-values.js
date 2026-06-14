import { parseFloat } from "jayess:number";
import { slice, split, startsWith, trim } from "jayess:string";

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

function parseCssSizeTerm(value) {
  var text = trim(value);
  if (text === "auto") {
    return { kind: "auto", value: null };
  }
  if (endsWith(text, "%")) {
    return { kind: "percent", value: parseNumberPart(text, "%") };
  }
  if (endsWith(text, "rem")) {
    return { kind: "rem", value: parseNumberPart(text, "rem") };
  }
  if (endsWith(text, "em")) {
    return { kind: "em", value: parseNumberPart(text, "em") };
  }
  if (endsWith(text, "vh")) {
    return { kind: "vh", value: parseNumberPart(text, "vh") };
  }
  if (endsWith(text, "vw")) {
    return { kind: "vw", value: parseNumberPart(text, "vw") };
  }
  if (endsWith(text, "px")) {
    return { kind: "px", value: parseNumberPart(text, "px") };
  }
  var parsed = parseFloat(text);
  if (parsed === null) {
    fail("jayess:canvas css expected a numeric size");
  }
  return { kind: "px", value: parsed };
}

function parseCalcSize(value) {
  var text = trim(value);
  var inner = trim(slice(text, 5, text.length - 1));
  var tokens = split(inner, " ");
  var terms = [];
  var pendingOp = "+";
  for (var index = 0; index < tokens.length; index = index + 1) {
    var token = trim(tokens[index]);
    if (token.length === 0) {
      continue;
    }
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      pendingOp = token;
      continue;
    }
    terms.push({
      op: pendingOp,
      size: parseCssSizeTerm(token)
    });
    pendingOp = "+";
  }
  if (terms.length === 0) {
    fail("jayess:canvas css calc() must contain at least one size");
  }
  if (pendingOp !== "+") {
    fail("jayess:canvas css calc() cannot end with an operator");
  }
  return {
    kind: "calc",
    value: terms
  };
}

export function parseCssSize(value) {
  var text = trim(value);
  if (startsWith(text, "calc(") && endsWith(text, ")")) {
    return parseCalcSize(text);
  }
  if (startsWith(text, "calc(")) {
    fail("jayess:canvas css calc() is not closed");
  }
  return parseCssSizeTerm(text);
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
