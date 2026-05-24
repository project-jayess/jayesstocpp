#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessRegexCreate(const std::vector<jayess::value>& jayessArgs) {
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
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_test(regex, text);
}

inline jayess::value jayessRegexExec(const std::vector<jayess::value>& jayessArgs) {
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_exec(regex, text);
}

inline jayess::value jayessRegexSplit(const std::vector<jayess::value>& jayessArgs) {
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_split(regex, text);
}

inline jayess::value jayessRegexMatchAll(const std::vector<jayess::value>& jayessArgs) {
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::regex_match_all(regex, text);
}

inline jayess::value jayessRegexReplaceFirst(const std::vector<jayess::value>& jayessArgs) {
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  const auto replacement = jayess::argument_at(jayessArgs, 2);
  return jayess::regex_replace_first(regex, text, replacement);
}

inline jayess::value jayessRegexReplaceAll(const std::vector<jayess::value>& jayessArgs) {
  const auto regex = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  const auto replacement = jayess::argument_at(jayessArgs, 2);
  return jayess::regex_replace_all(regex, text, replacement);
}

inline jayess::value jayessRegexIsRegex(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_regex_value(input));
}
