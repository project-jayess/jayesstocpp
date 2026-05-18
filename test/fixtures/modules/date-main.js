import {
  addMillis,
  diffMillis,
  fromUnixMillis,
  getUtcYear,
  isDate,
  now,
  parseIso,
  toIsoString,
  toUnixMillis
} from "jayess:date";

export function run(value) {
  var current = now();
  var fixed = fromUnixMillis(value);
  var shifted = addMillis(fixed, 1000);
  var parsed = parseIso(toIsoString(fixed));
  if (isDate(current) && isDate(parsed)) {
    return [toUnixMillis(shifted), diffMillis(shifted, fixed), getUtcYear(parsed)];
  }
  return 0;
}
