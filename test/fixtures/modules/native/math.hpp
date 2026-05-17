#pragma once
#include "runtime/jayess_runtime.hpp"

inline jayess::value nativeAdd(jayess::value left, jayess::value right) {
  return jayess::add(left, right);
}
