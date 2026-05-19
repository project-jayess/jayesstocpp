import { currentId, hardwareConcurrency, join, sleep, spawn } from "jayess:thread";

function add(left, right) {
  return left + right;
}

export function run() {
  var handle = spawn(add, [1, 2]);
  sleep(0);
  return [join(handle), hardwareConcurrency(), currentId()];
}
