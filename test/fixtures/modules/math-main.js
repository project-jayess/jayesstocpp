import { abs, ceil, floor, max, min, pow, round, sqrt } from "jayess:math";

export function run(value, base, exponent) {
  return [
    abs(value),
    floor(value),
    ceil(value),
    round(value),
    min(value, 0, 3),
    max(value, 0, 3),
    sqrt(9),
    sqrt(-1),
    pow(base, exponent)
  ];
}
