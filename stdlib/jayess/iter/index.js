import {
  jayessIterChain,
  jayessIterEvery,
  jayessIterFilter,
  jayessIterFind,
  jayessIterForEach,
  jayessIterMap,
  jayessIterNext,
  jayessIterRange,
  jayessIterReduce,
  jayessIterSome,
  jayessIterTake,
  jayessIterToArray
} from "./iter-primitives.hpp";

export function next(generator) {
  return jayessIterNext(generator);
}

export function toArray(generator) {
  return jayessIterToArray(generator);
}

export function take(generator, count) {
  return jayessIterTake(generator, count);
}

export function map(generator, callback) {
  return jayessIterMap(generator, callback);
}

export function filter(generator, callback) {
  return jayessIterFilter(generator, callback);
}

export function forEach(generator, callback) {
  return jayessIterForEach(generator, callback);
}

export function reduce(generator, callback, initial) {
  return jayessIterReduce(generator, callback, initial);
}

export function some(generator, callback) {
  return jayessIterSome(generator, callback);
}

export function every(generator, callback) {
  return jayessIterEvery(generator, callback);
}

export function find(generator, callback) {
  return jayessIterFind(generator, callback);
}

export function chain(left, right) {
  return jayessIterChain(left, right);
}

export function range(start, end, step) {
  return jayessIterRange(start, end, step);
}
