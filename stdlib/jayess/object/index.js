import {
  jayessObjectEntries,
  jayessObjectKeys,
  jayessObjectValues
} from "./object-primitives.hpp";

export function keys(value) {
  return jayessObjectKeys(value);
}

export function values(value) {
  return jayessObjectValues(value);
}

export function entries(value) {
  return jayessObjectEntries(value);
}
