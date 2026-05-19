#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessObjectHas(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  return jayess::object_has(value, key);
}

inline jayess::value jayessObjectKeys(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_keys(value);
}

inline jayess::value jayessObjectValues(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_values(value);
}

inline jayess::value jayessObjectEntries(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_entries(value);
}

inline jayess::value jayessObjectFromEntries(const std::vector<jayess::value>& jayessArgs) {
  const auto entries = jayess::argument_at(jayessArgs, 0);
  return jayess::object_from_entries(entries);
}

inline jayess::value jayessObjectAssign(const std::vector<jayess::value>& jayessArgs) {
  const auto target = jayess::argument_at(jayessArgs, 0);
  const auto source = jayess::argument_at(jayessArgs, 1);
  return jayess::object_assign(target, source);
}
