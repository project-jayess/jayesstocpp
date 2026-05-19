import {
  jayessObjectAssign,
  jayessObjectEntries,
  jayessObjectFromEntries,
  jayessObjectHas,
  jayessObjectKeys,
  jayessObjectValues
} from "./object-primitives.hpp";

export function has(value, key) {
  return jayessObjectHas(value, key);
}

export function keys(value) {
  return jayessObjectKeys(value);
}

export function values(value) {
  return jayessObjectValues(value);
}

export function entries(value) {
  return jayessObjectEntries(value);
}

export function fromEntries(entries) {
  return jayessObjectFromEntries(entries);
}

export function assign(target, source) {
  return jayessObjectAssign(target, source);
}
