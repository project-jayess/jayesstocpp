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

inline jayess::value jayessStringIndexOf(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto needle = jayess::argument_at(jayessArgs, 1);
  return jayess::string_index_of(text, {needle});
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

inline jayess::value jayessStringReplaceFirst(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_replace_first(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessStringReplaceAll(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_replace_all(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline std::vector<jayess::value> jayessStringOptionalFillArgs(
  const std::vector<jayess::value>& jayessArgs,
  const std::string& message
) {
  std::vector<jayess::value> args = {jayess::argument_at(jayessArgs, 1)};
  const auto fillArgs = jayess::argument_at(jayessArgs, 2);
  if (!std::holds_alternative<jayess::array_ptr>(fillArgs)) {
    throw std::runtime_error(message);
  }
  const auto& items = std::get<jayess::array_ptr>(fillArgs)->items;
  if (items.size() > 1) {
    throw std::runtime_error(message);
  }
  if (!items.empty()) {
    args.push_back(items[0]);
  }
  return args;
}

inline jayess::value jayessStringPadStart(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_pad_start(
    jayess::argument_at(jayessArgs, 0),
    jayessStringOptionalFillArgs(jayessArgs, "Jayess string padStart expects at most one fill argument")
  );
}

inline jayess::value jayessStringPadEnd(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_pad_end(
    jayess::argument_at(jayessArgs, 0),
    jayessStringOptionalFillArgs(jayessArgs, "Jayess string padEnd expects at most one fill argument")
  );
}

inline jayess::value jayessStringRepeat(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_repeat(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessStringToLower(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_to_lower(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessStringToUpper(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_to_upper(jayess::argument_at(jayessArgs, 0));
}
