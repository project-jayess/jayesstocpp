import {
  jayessMapClear,
  jayessMapCreate,
  jayessMapDeleteKey,
  jayessMapGet,
  jayessMapHas,
  jayessMapIsMap,
  jayessMapSet,
  jayessMapSize
} from "./map-primitives.hpp";

export function create() {
  return jayessMapCreate();
}

export function get(map, key) {
  return jayessMapGet(map, key);
}

export function set(map, key, value) {
  return jayessMapSet(map, key, value);
}

export function has(map, key) {
  return jayessMapHas(map, key);
}

export function deleteKey(map, key) {
  return jayessMapDeleteKey(map, key);
}

export function clear(map) {
  return jayessMapClear(map);
}

export function size(map) {
  return jayessMapSize(map);
}

export function isMap(value) {
  return jayessMapIsMap(value);
}
