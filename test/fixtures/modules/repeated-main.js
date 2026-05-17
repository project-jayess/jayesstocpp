import { add } from "./math.js";
import { add as alsoAdd } from "./math.js";

export function run(a, b) {
  return add(a, b) + alsoAdd(a, b);
}
