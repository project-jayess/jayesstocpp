#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessMathAbs(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_abs(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessMathFloor(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_floor(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessMathCeil(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_ceil(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessMathRound(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_round(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessMathMin(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_min(jayessArgs);
}

inline jayess::value jayessMathMax(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_max(jayessArgs);
}

inline jayess::value jayessMathSqrt(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_sqrt(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessMathPow(const std::vector<jayess::value>& jayessArgs) {
  return jayess::math_pow(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}
