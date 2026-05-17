import {
  jayessSetAdd,
  jayessSetClear,
  jayessSetCreate,
  jayessSetDeleteValue,
  jayessSetHas,
  jayessSetIsSet,
  jayessSetSize
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

export function isSet(value) {
  return jayessSetIsSet(value);
}
