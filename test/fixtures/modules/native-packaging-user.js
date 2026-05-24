import { nativeAdd } from "./native/math.hpp";
import "./native/math.cpp";
import "./native/math.dll";
import "./native/math.lib";

export function run(a, b) {
  return nativeAdd(a, b);
}
