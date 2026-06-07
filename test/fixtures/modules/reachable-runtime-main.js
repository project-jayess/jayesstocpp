import { used } from "./reachable-runtime-lib.js";

export function run(value) {
  return used(value);
}
