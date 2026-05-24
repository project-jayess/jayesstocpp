#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessNumberRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline jayess::value jayessNumberIsInteger(const std::vector<jayess::value>& jayessArgs) {
  jayessNumberRequireExactArgs(jayessArgs, 1, "Jayess number isInteger expects exactly one argument");
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_is_integer(input);
}

inline jayess::value jayessNumberIsFinite(const std::vector<jayess::value>& jayessArgs) {
  jayessNumberRequireExactArgs(jayessArgs, 1, "Jayess number isFinite expects exactly one argument");
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_is_finite(input);
}

inline jayess::value jayessNumberParseInt(const std::vector<jayess::value>& jayessArgs) {
  jayessNumberRequireExactArgs(jayessArgs, 1, "Jayess number parseInt expects exactly one argument");
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_parse_int(input);
}

inline jayess::value jayessNumberParseFloat(const std::vector<jayess::value>& jayessArgs) {
  jayessNumberRequireExactArgs(jayessArgs, 1, "Jayess number parseFloat expects exactly one argument");
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_parse_float(input);
}
