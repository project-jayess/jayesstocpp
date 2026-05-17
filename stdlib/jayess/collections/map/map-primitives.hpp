#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessMapCreate(const std::vector<jayess::value>&) {
  return jayess::make_map();
}

inline jayess::value jayessMapGet(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  return jayess::map_get(map, key);
}

inline jayess::value jayessMapSet(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  const auto assigned = jayess::argument_at(jayessArgs, 2);
  return jayess::map_set(map, key, assigned);
}

inline jayess::value jayessMapHas(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  return jayess::map_has(map, key);
}

inline jayess::value jayessMapDeleteKey(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  return jayess::map_delete(map, key);
}

inline jayess::value jayessMapClear(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  return jayess::map_clear(map);
}

inline jayess::value jayessMapSize(const std::vector<jayess::value>& jayessArgs) {
  const auto map = jayess::argument_at(jayessArgs, 0);
  return jayess::map_size(map);
}

inline jayess::value jayessMapIsMap(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_map_value(value));
}
