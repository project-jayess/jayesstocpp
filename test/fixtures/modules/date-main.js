import { fromUnixMillis, isDate, now, toUnixMillis } from "jayess:date";

export function run(value) {
  var current = now();
  var fixed = fromUnixMillis(value);
  if (isDate(current)) {
    return toUnixMillis(fixed);
  }
  return 0;
}
