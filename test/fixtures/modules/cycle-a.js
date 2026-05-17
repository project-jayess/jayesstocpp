import { readB } from "./cycle-b.js";

export function readA(a) {
  return readB(a);
}
