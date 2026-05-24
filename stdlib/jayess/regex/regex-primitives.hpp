#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessRegexRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline jayess::value jayessRegexCreate(const std::vector<jayess::value>& jayessArgs) {
  if (jayessArgs.size() < 1 || jayessArgs.size() > 2) {
    throw std::runtime_error("Jayess regex create expects one or two arguments");
  }
  const auto pattern = jayess::argument_at(jayessArgs, 0);
  jayess::value flags = jayess::value(std::monostate{});
  if (jayess::has_argument(jayessArgs, 1)) {
    const auto flagArgs = jayess::argument_at(jayessArgs, 1);
    if (!std::holds_alternative<jayess::array_ptr>(flagArgs)) {
      throw std::runtime_error("Jayess regex create expects optional flags arguments");
    }

    const auto& items = std::get<jayess::array_ptr>(flagArgs)->items;
    if (items.size() > 1) {
      throw std::runtime_error("Jayess regex create expects at most one flags argument");
    }
    if (!items.empty()) {
      flags = items[0];
    }
  }
  return jayess::regex_create(pattern, flags);
}

inline jayess::value jayessRegexTest(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 2, "Jayess regex test expects exactly two arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_test(regex, text);
}

inline jayess::value jayessRegexExec(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 2, "Jayess regex exec expects exactly two arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_exec(regex, text);
}

inline jayess::value jayessRegexSplit(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 2, "Jayess regex split expects exactly two arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_split(regex, text);
}

inline jayess::value jayessRegexMatchAll(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 2, "Jayess regex matchAll expects exactly two arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_match_all(regex, text);
}

inline jayess::value jayessRegexReplaceFirst(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 3, "Jayess regex replaceFirst expects exactly three arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  const auto replacement = jayess::argument_at(jayessArgs, 2);
  return jayess::regex_replace_first(regex, text, replacement);
}

inline jayess::value jayessRegexReplaceAll(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 3, "Jayess regex replaceAll expects exactly three arguments");
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  const auto replacement = jayess::argument_at(jayessArgs, 2);
  return jayess::regex_replace_all(regex, text, replacement);
}

inline jayess::value jayessRegexIsRegex(const std::vector<jayess::value>& jayessArgs) {
  jayessRegexRequireExactArgs(jayessArgs, 1, "Jayess regex isRegex expects exactly one argument");
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_regex_value(input));
}
