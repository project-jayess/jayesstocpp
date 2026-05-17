import { readA } from "./cycle-a.js";

export function readB(a) {
  return readA(a);
}
