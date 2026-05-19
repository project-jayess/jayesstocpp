#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::vector<jayess::value> jayessStringOptionalEndArgs(const std::vector<jayess::value>& jayessArgs) {
  std::vector<jayess::value> args = {jayess::argument_at(jayessArgs, 1)};
  const auto endArgs = jayess::argument_at(jayessArgs, 2);
  if (!std::holds_alternative<jayess::array_ptr>(endArgs)) {
    throw std::runtime_error("Jayess string slice expects optional end arguments");
  }

  const auto& items = std::get<jayess::array_ptr>(endArgs)->items;
  if (items.size() > 1) {
    throw std::runtime_error("Jayess string slice expects at most one end argument");
  }
  if (!items.empty()) {
    args.push_back(items[0]);
  }
  return args;
}

inline jayess::value jayessStringTrim(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_trim(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessStringStartsWith(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto prefix = jayess::argument_at(jayessArgs, 1);
  return jayess::string_starts_with(text, {prefix});
}

inline jayess::value jayessStringEndsWith(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto suffix = jayess::argument_at(jayessArgs, 1);
  return jayess::string_ends_with(text, {suffix});
}

inline jayess::value jayessStringIncludes(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto needle = jayess::argument_at(jayessArgs, 1);
  return jayess::string_includes(text, {needle});
}

inline jayess::value jayessStringSlice(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  return jayess::string_slice(text, jayessStringOptionalEndArgs(jayessArgs));
}

inline jayess::value jayessStringSplit(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto separator = jayess::argument_at(jayessArgs, 1);
  return jayess::string_split(text, separator);
}
