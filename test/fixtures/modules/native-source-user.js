import { nativeAdd } from "./native/math.hpp";
import "./native/math.cpp";

export function run(a, b) {
  return nativeAdd(a, b);
}
