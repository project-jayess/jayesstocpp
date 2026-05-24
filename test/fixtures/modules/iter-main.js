import {
  chain,
  every,
  filter,
  find,
  forEach,
  map,
  next,
  range,
  reduce,
  some,
  take,
  toArray
} from "jayess:iter";

function* values(first, second, third) {
  yield first;
  yield second;
  yield third;
}

function* empty() {
}

export function run(first, second, third) {
  var calls = [];
  var one = next(values(first, second, third));
  var pair = take(values(first, second, third), 2);
  var all = toArray(values(first, second, third));
  var mapped = map(values(first, second, third), function (value) { return value + 1; });
  var filtered = filter(values(first, second, third), function (value) { return value; });
  var total = reduce(values(first, second, third), function (accumulator, value) { return accumulator + value; }, 0);
  var anySecond = some(values(first, second, third), function (value) { return value == second; });
  var allPresent = every(values(first, second, third), function (value) { return value; });
  var found = find(values(first, second, third), function (value) { return value == third; });
  forEach(values(first, second, third), function (value) { calls.push(value); });
  var chained = toArray(chain(values(first, second, third), values(4, 5, 6)));
  var forward = toArray(range(1, 5, 2));
  var backward = toArray(range(5, 1, -2));
  var emptyFound = find(empty(), function (value) { return value; });
  var emptyEvery = every(empty(), function (value) { return value; });
  return [one, pair, all, mapped, filtered, total, anySecond, allPresent, found, calls, chained, forward, backward, emptyFound, emptyEvery];
}
