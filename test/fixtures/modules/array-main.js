import { concat, every, filter, find, findIndex, includes, indexOf, join, map, reduce, reverse, slice, some, sort } from "jayess:array";

export function run(items) {
  return [
    slice(items, 1, 3),
    concat(items, [4, 5]),
    indexOf(items, 2),
    includes(items, 3),
    find(items, function aboveTwo(value) { return value > 2; }),
    findIndex(items, function aboveTwoIndex(value) { return value > 2; }),
    some(items, function hasTruthy(value) { return value; }),
    every(items, function allTruthy(value) { return value; }),
    join(items, "-"),
    reverse(items),
    sort(items),
    sort(items, function descending(left, right) { return right - left; }),
    map(items, function double(value) { return value + value; }),
    filter(items, function keep(value) { return value; }),
    reduce(items, function sum(total, value) { return total + value; }, 0)
  ];
}
