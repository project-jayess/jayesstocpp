import { resolved, timeout } from "jayess:async";

export async function run(value) {
  return await timeout(resolved(value), 1);
}
