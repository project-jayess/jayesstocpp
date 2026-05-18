#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessSetCreate(const std::vector<jayess::value>&) {
  return jayess::make_set();
}

inline jayess::value jayessSetAdd(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  const auto member = jayess::argument_at(jayessArgs, 1);
  return jayess::set_add(set, member);
}

inline jayess::value jayessSetHas(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  const auto member = jayess::argument_at(jayessArgs, 1);
  return jayess::set_has(set, member);
}

inline jayess::value jayessSetDeleteValue(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  const auto member = jayess::argument_at(jayessArgs, 1);
  return jayess::set_delete(set, member);
}

inline jayess::value jayessSetClear(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  return jayess::set_clear(set);
}

inline jayess::value jayessSetSize(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  return jayess::set_size(set);
}

inline jayess::value jayessSetValues(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  return jayess::set_values(set);
}

inline jayess::value jayessSetEntries(const std::vector<jayess::value>& jayessArgs) {
  const auto set = jayess::argument_at(jayessArgs, 0);
  return jayess::set_entries(set);
}

inline jayess::value jayessSetIsSet(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_set_value(value));
}
