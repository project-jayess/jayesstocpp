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

var callCount = 0;

function* values() {
  yield 1;
  yield 2;
  yield 3;
}

function* empty() {
}

function* broken() {
  yield "ready";
  throw "iter boom";
}

export function inspect() {
  callCount = 0;
  return [
    next(empty()),
    take(values(), 0).length,
    every(empty(), function alwaysFalse() { return false; }),
    find(empty(), function anyValue() { return true; }),
    some(values(), function isTwo(value) { return value == 2; }),
    reduce(values(), function add(total, value) { return total + value; }, 0),
    map(values(), function double(value) { return value + value; })[1],
    filter(values(), function keepOdd(value) { return value != 2; }).length,
    toArray(chain(values(), range(4, 6, 1))).length,
    forEach(values(), function collect(value) { callCount = callCount + value - value + 1; }),
    callCount
  ];
}

export function callbackFailure() {
  return map(values(), function explode() {
    throw "iter callback boom";
  });
}

export function generatorFailure() {
  var generator = broken();
  next(generator);
  return toArray(generator);
}

export function invalidTakeCount() {
  return take(values(), -1);
}

export function invalidRangeStep() {
  return toArray(range(0, 3, 0));
}

export function invalidNextInput() {
  return next(null);
}
