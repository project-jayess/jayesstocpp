#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessValidateTypeOf(const std::vector<jayess::value>& jayessArgs) {
  return jayess::validate_type_of(jayess::argument_at(jayessArgs, 0));
}
