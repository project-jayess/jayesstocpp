#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessObjectRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline jayess::value jayessObjectHas(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 2, "Jayess object has expects exactly two arguments");
  const auto value = jayess::argument_at(jayessArgs, 0);
  const auto key = jayess::argument_at(jayessArgs, 1);
  return jayess::object_has(value, key);
}

inline jayess::value jayessObjectKeys(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 1, "Jayess object keys expects exactly one argument");
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_keys(value);
}

inline jayess::value jayessObjectValues(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 1, "Jayess object values expects exactly one argument");
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_values(value);
}

inline jayess::value jayessObjectEntries(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 1, "Jayess object entries expects exactly one argument");
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::object_entries(value);
}

inline jayess::value jayessObjectFromEntries(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 1, "Jayess object fromEntries expects exactly one argument");
  const auto entries = jayess::argument_at(jayessArgs, 0);
  return jayess::object_from_entries(entries);
}

inline jayess::value jayessObjectAssign(const std::vector<jayess::value>& jayessArgs) {
  jayessObjectRequireExactArgs(jayessArgs, 2, "Jayess object assign expects exactly two arguments");
  const auto target = jayess::argument_at(jayessArgs, 0);
  const auto source = jayess::argument_at(jayessArgs, 1);
  return jayess::object_assign(target, source);
}
