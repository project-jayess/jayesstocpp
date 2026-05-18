#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessNumberParseInt(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_parse_int(input);
}

inline jayess::value jayessNumberParseFloat(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::number_parse_float(input);
}
