import { next, toArray } from "jayess:iter";

function* values(first, second) {
  yield first;
  yield second;
}

export function run() {
  var generator = values("Jay", "ess");
  var first = next(generator);
  var second = next(generator);
  var done = next(generator);
  var replay = toArray(values(1, 2));
  return [first, second, done, replay.length];
}
