import {
  jayessNumberParseFloat,
  jayessNumberParseInt
} from "./number-primitives.hpp";

export function parseInt(text) {
  return jayessNumberParseInt(text);
}

export function parseFloat(text) {
  return jayessNumberParseFloat(text);
}
