import { assign, entries, fromEntries, has, keys, values } from "jayess:object";

export function inspect() {
  var data = { zebra: 3, apple: 1, middle: 2 };
  var copied = assign({ keep: true }, data);
  var built = fromEntries([["beta", 2], ["alpha", 1]]);
  var orderedKeys = keys(data);
  var orderedValues = values(data);
  var orderedEntries = entries(data);

  return [
    has(data, "apple"),
    orderedKeys[0],
    orderedKeys[1],
    orderedKeys[2],
    orderedValues[0],
    orderedValues[1],
    orderedValues[2],
    orderedEntries[0][0],
    orderedEntries[0][1],
    copied.apple,
    copied.keep,
    built.alpha,
    built.beta
  ];
}

export function invalidNullKeys() {
  return keys(null);
}

export function invalidNumericKey() {
  return has({ value: 1 }, 1);
}

export function invalidEntryShape() {
  return fromEntries([["ok", 1], ["bad"]]);
}

export function invalidAssignSource() {
  return assign({ value: 1 }, null);
}
