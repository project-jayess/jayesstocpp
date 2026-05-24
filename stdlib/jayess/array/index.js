import {
  jayessArrayConcat,
  jayessArrayEvery,
  jayessArrayFilter,
  jayessArrayFind,
  jayessArrayFindIndex,
  jayessArrayIncludes,
  jayessArrayIndexOf,
  jayessArrayJoin,
  jayessArrayMap,
  jayessArrayReduce,
  jayessArrayReverse,
  jayessArraySome,
  jayessArraySort,
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

export function find(items, callback) {
  return jayessArrayFind(items, callback);
}

export function findIndex(items, callback) {
  return jayessArrayFindIndex(items, callback);
}

export function some(items, callback) {
  return jayessArraySome(items, callback);
}

export function every(items, callback) {
  return jayessArrayEvery(items, callback);
}

export function join(items, ...separator) {
  return jayessArrayJoin(items, separator);
}

export function reverse(items) {
  return jayessArrayReverse(items);
}

export function sort(items, ...callback) {
  return jayessArraySort(items, callback);
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
