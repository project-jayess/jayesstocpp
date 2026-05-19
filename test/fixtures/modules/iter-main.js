import { filter, map, next, take, toArray } from "jayess:iter";

function* values(first, second, third) {
  yield first;
  yield second;
  yield third;
}

export function run(first, second, third) {
  var one = next(values(first, second, third));
  var pair = take(values(first, second, third), 2);
  var all = toArray(values(first, second, third));
  var mapped = map(values(first, second, third), function (value) { return value + 1; });
  var filtered = filter(values(first, second, third), function (value) { return value; });
  return [one, pair, all, mapped, filtered];
}
