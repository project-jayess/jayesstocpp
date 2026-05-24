import {
  every,
  filter,
  find,
  findIndex,
  join,
  map,
  reduce,
  reverse,
  slice,
  some,
  sort
} from "jayess:array";

export function inspect() {
  return [
    slice([], 0).length,
    find([], function match() { return true; }),
    findIndex([], function matchIndex() { return true; }),
    some([], function hasAny() { return true; }),
    every([], function allOfEmpty() { return false; }),
    join([], "-"),
    reverse([]).length,
    sort([]).length,
    map([], function double(value) { return value + value; }).length,
    filter([], function keep(value) { return value; }).length,
    reduce([], function sum(total, value) { return total + value; }, 7)
  ];
}

export function callbackFailure() {
  return map([1], function explode() {
    throw "array boom";
  });
}

export function invalidSortArity() {
  return sort([1], null, null);
}
