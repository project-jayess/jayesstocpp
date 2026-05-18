#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessRegexCreate(const std::vector<jayess::value>& jayessArgs) {
  const auto pattern = jayess::argument_at(jayessArgs, 0);
  return jayess::regex_create(pattern);
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

inline jayess::value jayessRegexIsRegex(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_regex_value(input));
}
