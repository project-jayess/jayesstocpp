import { resolved } from "jayess:async";
import { parseInt } from "jayess:number";

export async function parseValue(text) {
  var parsed = parseInt(text);
  return await resolved(parsed ?? 0);
}

export function* expand(values) {
  var first = values[0] ?? 0;
  yield first;
  yield* values;
}
