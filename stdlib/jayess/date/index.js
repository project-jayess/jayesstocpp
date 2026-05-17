import {
  jayessDateFromUnixMillis,
  jayessDateNow,
  jayessDateToUnixMillis,
  jayessIsDateValue
} from "./date-primitives.hpp";

export function now() {
  return jayessDateNow();
}

export function fromUnixMillis(value) {
  return jayessDateFromUnixMillis(value);
}

export function toUnixMillis(date) {
  return jayessDateToUnixMillis(date);
}

export function isDate(value) {
  return jayessIsDateValue(value);
}
