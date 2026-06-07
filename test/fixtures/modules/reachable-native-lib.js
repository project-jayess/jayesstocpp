import { nativeAdd } from "./native/math.hpp";

export function used(value) {
  return value;
}

export function unused(left, right) {
  return nativeAdd(left, right);
}
