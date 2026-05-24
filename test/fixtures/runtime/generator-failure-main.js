import { next } from "jayess:iter";

function* values() {
  yield "ready";
  throw "boom";
}

export function firstValue() {
  var generator = values();
  return next(generator);
}

export function failureValue() {
  var generator = values();
  next(generator);
  return next(generator);
}
