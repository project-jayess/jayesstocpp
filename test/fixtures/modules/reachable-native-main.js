import { used } from "./reachable-native-lib.js";

export function run(value) {
  return used(value);
}
