import { next } from "jayess:iter";

function* values(start) {
  var value = start;
  try {
    value = value + 1;
    yield value;
    value = value + 2;
    yield value;
    value = value + 3;
  } finally {
    value = value + 4;
  }
  return value;
}

export function run() {
  var generator = values(1);
  var first = next(generator);
  var second = next(generator);
  var completed = next(generator);
  return [first, second, completed];
}
