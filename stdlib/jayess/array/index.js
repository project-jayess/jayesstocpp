import {
  jayessArrayConcat,
  jayessArrayFilter,
  jayessArrayIncludes,
  jayessArrayIndexOf,
  jayessArrayJoin,
  jayessArrayMap,
  jayessArrayReduce,
  jayessArraySlice
} from "./array-primitives.hpp";

export function slice(items, start, ...end) {
  return jayessArraySlice(items, start, end);
}

export function concat(left, right) {
  return jayessArrayConcat(left, right);
}

export function indexOf(items, needle) {
  return jayessArrayIndexOf(items, needle);
}

export function includes(items, needle) {
  return jayessArrayIncludes(items, needle);
}

export function join(items, ...separator) {
  return jayessArrayJoin(items, separator);
}

export function map(items, callback) {
  return jayessArrayMap(items, callback);
}

export function filter(items, callback) {
  return jayessArrayFilter(items, callback);
}

export function reduce(items, callback, initial) {
  return jayessArrayReduce(items, callback, initial);
}
