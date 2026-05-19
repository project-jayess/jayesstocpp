import { concat, filter, includes, indexOf, join, map, reduce, slice } from "jayess:array";

export function run(items) {
  return [
    slice(items, 1, 3),
    concat(items, [4, 5]),
    indexOf(items, 2),
    includes(items, 3),
    join(items, "-"),
    map(items, function double(value) { return value + value; }),
    filter(items, function keep(value) { return value; }),
    reduce(items, function sum(total, value) { return total + value; }, 0)
  ];
}
