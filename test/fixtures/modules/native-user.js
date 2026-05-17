import { nativeAdd } from "./native/math.hpp";

export function run(a, b) {
  return nativeAdd(a, b);
}
