import {
  jayessMapClear,
  jayessMapCreate,
  jayessMapDeleteKey,
  jayessMapEntries,
  jayessMapDeleteAll,
  jayessMapFromEntries,
  jayessMapGet,
  jayessMapHas,
  jayessMapIsMap,
  jayessMapKeys,
  jayessMapSet,
  jayessMapSetAll,
  jayessMapSize,
  jayessMapValues
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

export function keys(map) {
  return jayessMapKeys(map);
}

export function values(map) {
  return jayessMapValues(map);
}

export function entries(map) {
  return jayessMapEntries(map);
}

export function fromEntries(entries) {
  return jayessMapFromEntries(entries);
}

export function setAll(map, entries) {
  return jayessMapSetAll(map, entries);
}

export function deleteAll(map, keys) {
  return jayessMapDeleteAll(map, keys);
}

export function isMap(value) {
  return jayessMapIsMap(value);
}
