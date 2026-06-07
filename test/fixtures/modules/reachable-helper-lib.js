import { extra } from "./graph-extra.js";

function double(value) {
  return value * 2;
}

export function run(value) {
  return double(value) + extra;
}

export function unused(value) {
  return value - 1;
}
