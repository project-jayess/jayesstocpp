import {
  jayessMathAbs,
  jayessMathCeil,
  jayessMathFloor,
  jayessMathMax,
  jayessMathMin,
  jayessMathPow,
  jayessMathRound,
  jayessMathSqrt
} from "./math-primitives.hpp";

export function abs(value) {
  return jayessMathAbs(value);
}

export function floor(value) {
  return jayessMathFloor(value);
}

export function ceil(value) {
  return jayessMathCeil(value);
}

export function round(value) {
  return jayessMathRound(value);
}

export function min(...values) {
  return jayessMathMin(...values);
}

export function max(...values) {
  return jayessMathMax(...values);
}

export function sqrt(value) {
  return jayessMathSqrt(value);
}

export function pow(base, exponent) {
  return jayessMathPow(base, exponent);
}
