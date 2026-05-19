import {
  jayessIterFilter,
  jayessIterMap,
  jayessIterNext,
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
