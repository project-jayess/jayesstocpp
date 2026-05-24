#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessStringRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline std::vector<jayess::value> jayessStringOptionalEndArgs(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 3, "Jayess string slice expects exactly two or three arguments");
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
  jayessStringRequireExactArgs(jayessArgs, 1, "Jayess string trim expects exactly one argument");
  return jayess::string_trim(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessStringStartsWith(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string startsWith expects exactly two arguments");
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto prefix = jayess::argument_at(jayessArgs, 1);
  return jayess::string_starts_with(text, {prefix});
}

inline jayess::value jayessStringEndsWith(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string endsWith expects exactly two arguments");
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto suffix = jayess::argument_at(jayessArgs, 1);
  return jayess::string_ends_with(text, {suffix});
}

inline jayess::value jayessStringIncludes(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string includes expects exactly two arguments");
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto needle = jayess::argument_at(jayessArgs, 1);
  return jayess::string_includes(text, {needle});
}

inline jayess::value jayessStringIndexOf(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string indexOf expects exactly two arguments");
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto needle = jayess::argument_at(jayessArgs, 1);
  return jayess::string_index_of(text, {needle});
}

inline jayess::value jayessStringSlice(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  return jayess::string_slice(text, jayessStringOptionalEndArgs(jayessArgs));
}

inline jayess::value jayessStringSplit(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string split expects exactly two arguments");
  const auto text = jayess::argument_at(jayessArgs, 0);
  const auto separator = jayess::argument_at(jayessArgs, 1);
  return jayess::string_split(text, separator);
}

inline jayess::value jayessStringReplaceFirst(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 3, "Jayess string replaceFirst expects exactly three arguments");
  return jayess::string_replace_first(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessStringReplaceAll(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 3, "Jayess string replaceAll expects exactly three arguments");
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
  jayessStringRequireExactArgs(jayessArgs, 3, message);
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
    jayessStringOptionalFillArgs(jayessArgs, "Jayess string padStart expects two or three arguments")
  );
}

inline jayess::value jayessStringPadEnd(const std::vector<jayess::value>& jayessArgs) {
  return jayess::string_pad_end(
    jayess::argument_at(jayessArgs, 0),
    jayessStringOptionalFillArgs(jayessArgs, "Jayess string padEnd expects two or three arguments")
  );
}

inline jayess::value jayessStringRepeat(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 2, "Jayess string repeat expects exactly two arguments");
  return jayess::string_repeat(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessStringToLower(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 1, "Jayess string toLower expects exactly one argument");
  return jayess::string_to_lower(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessStringToUpper(const std::vector<jayess::value>& jayessArgs) {
  jayessStringRequireExactArgs(jayessArgs, 1, "Jayess string toUpper expects exactly one argument");
  return jayess::string_to_upper(jayess::argument_at(jayessArgs, 0));
}
