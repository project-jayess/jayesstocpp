#pragma once

#include "runtime/jayess_runtime.hpp"

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
