import { cssSizeKind, cssSizeValue } from "./css-values.js";

export function resolveCssSize(value, basis, fallback) {
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
  return amount;
}

export function hasExplicitSize(value) {
  return cssSizeKind(value) !== "auto";
}

export function resolveBoxSide(value, side, basis) {
  if (value === null) {
    return 0;
  }
  if (value[side] !== null) {
    return resolveCssSize(value[side], basis, 0);
  }
  return resolveCssSize(value, basis, 0);
}

export function uniformResolvedBoxValue(top, right, bottom, left) {
  if (top === right && top === bottom && top === left) {
    return top;
  }
  return null;
}
