import { next } from "jayess:iter";

function* values() {
  var value = 4;
  yield value;
  value = value + 1;
  return value;
}

function* implicitValues() {
  yield 1;
}

export function run() {
  var explicit = values();
  var first = next(explicit);
  var completed = next(explicit);
  var afterCompleted = next(explicit);
  var implicit = implicitValues();
  var implicitFirst = next(implicit);
  var implicitCompleted = next(implicit);
  return [first, completed, afterCompleted, implicitFirst, implicitCompleted];
}
