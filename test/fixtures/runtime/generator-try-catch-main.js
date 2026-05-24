import { next } from "jayess:iter";

function* values(start) {
  var value = start;
  try {
    throw value;
    yield 99;
  } catch (error) {
    value = error + 1;
    yield value;
    value = value + 1;
  }
  return value;
}

export function run() {
  var generator = values(4);
  var first = next(generator);
  var completed = next(generator);
  return [first, completed];
}
