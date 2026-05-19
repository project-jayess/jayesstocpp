import {
  jayessSetAdd,
  jayessSetClear,
  jayessSetCreate,
  jayessSetDeleteValue,
  jayessSetDifference,
  jayessSetEntries,
  jayessSetFromValues,
  jayessSetHas,
  jayessSetIntersection,
  jayessSetIsSet,
  jayessSetSize,
  jayessSetUnion,
  jayessSetValues
} from "./set-primitives.hpp";

export function create() {
  return jayessSetCreate();
}

export function add(set, value) {
  return jayessSetAdd(set, value);
}

export function has(set, value) {
  return jayessSetHas(set, value);
}

export function deleteValue(set, value) {
  return jayessSetDeleteValue(set, value);
}

export function clear(set) {
  return jayessSetClear(set);
}

export function size(set) {
  return jayessSetSize(set);
}

export function values(set) {
  return jayessSetValues(set);
}

export function entries(set) {
  return jayessSetEntries(set);
}

export function fromValues(values) {
  return jayessSetFromValues(values);
}

export function union(left, right) {
  return jayessSetUnion(left, right);
}

export function intersection(left, right) {
  return jayessSetIntersection(left, right);
}

export function difference(left, right) {
  return jayessSetDifference(left, right);
}

export function isSet(value) {
  return jayessSetIsSet(value);
}
