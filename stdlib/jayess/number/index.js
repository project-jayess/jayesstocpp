import {
  jayessNumberIsFinite,
  jayessNumberIsInteger,
  jayessNumberParseFloat,
  jayessNumberParseInt
} from "./number-primitives.hpp";

export function isInteger(value) {
  return jayessNumberIsInteger(value);
}

export function isFinite(value) {
  return jayessNumberIsFinite(value);
}

export function parseInt(text) {
  return jayessNumberParseInt(text);
}

export function parseFloat(text) {
  return jayessNumberParseFloat(text);
}
