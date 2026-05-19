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

inline jayess::value jayessSetFromValues(const std::vector<jayess::value>& jayessArgs) {
  const auto values = jayess::argument_at(jayessArgs, 0);
  return jayess::set_from_values(values);
}

inline jayess::value jayessSetUnion(const std::vector<jayess::value>& jayessArgs) {
  const auto left = jayess::argument_at(jayessArgs, 0);
  const auto right = jayess::argument_at(jayessArgs, 1);
  return jayess::set_union(left, right);
}

inline jayess::value jayessSetIntersection(const std::vector<jayess::value>& jayessArgs) {
  const auto left = jayess::argument_at(jayessArgs, 0);
  const auto right = jayess::argument_at(jayessArgs, 1);
  return jayess::set_intersection(left, right);
}

inline jayess::value jayessSetDifference(const std::vector<jayess::value>& jayessArgs) {
  const auto left = jayess::argument_at(jayessArgs, 0);
  const auto right = jayess::argument_at(jayessArgs, 1);
  return jayess::set_difference(left, right);
}

inline jayess::value jayessSetIsSet(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_set_value(value));
}
