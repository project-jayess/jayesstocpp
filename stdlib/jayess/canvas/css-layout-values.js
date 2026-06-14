import { cssSizeKind, cssSizeValue } from "./css-values.js";

function contextValue(context, key, fallback) {
  if (context === null) {
    return fallback;
  }
  if (context[key] === null) {
    return fallback;
  }
  return context[key];
}

export function resolveCssSizeWithContext(value, basis, fallback, context) {
  var kind = cssSizeKind(value);
  if (kind === "auto") {
    return fallback;
  }
  var amount = cssSizeValue(value);
  if (kind === "percent") {
    if (basis === null) {
      return fallback;
    }
    return basis * amount / 100;
  }
  if (kind === "em") {
    return amount * contextValue(context, "fontSize", 8);
  }
  if (kind === "rem") {
    return amount * contextValue(context, "rootFontSize", 8);
  }
  if (kind === "vw") {
    return contextValue(context, "viewportWidth", 0) * amount / 100;
  }
  if (kind === "vh") {
    return contextValue(context, "viewportHeight", 0) * amount / 100;
  }
  if (kind === "calc") {
    var total = 0;
    for (var index = 0; index < amount.length; index = index + 1) {
      var term = amount[index];
      var resolved = resolveCssSizeWithContext(term.size, basis, null, context);
      if (resolved === null) {
        return fallback;
      }
      if (term.op === "-") {
        total = total - resolved;
      } else if (term.op === "*") {
        total = total * resolved;
      } else if (term.op === "/") {
        if (resolved === 0) {
          throw "jayess:canvas css calc() cannot divide by zero";
        }
        total = total / resolved;
      } else {
        total = total + resolved;
      }
    }
    return total;
  }
  return amount;
}

export function resolveCssSize(value, basis, fallback) {
  return resolveCssSizeWithContext(value, basis, fallback, null);
}

export function hasExplicitSize(value) {
  return cssSizeKind(value) !== "auto";
}

export function resolveBoxSideWithContext(value, side, basis, context) {
  if (value === null) {
    return 0;
  }
  if (value[side] !== null) {
    return resolveCssSizeWithContext(value[side], basis, 0, context);
  }
  return resolveCssSizeWithContext(value, basis, 0, context);
}

export function resolveBoxSide(value, side, basis) {
  return resolveBoxSideWithContext(value, side, basis, null);
}

export function uniformResolvedBoxValue(top, right, bottom, left) {
  if (top === right && top === bottom && top === left) {
    return top;
  }
  return null;
}
