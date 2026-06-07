#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessFontKind(const std::vector<jayess::value>& jayessArgs) {
  return jayess::font_kind(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessFontLoad(const std::vector<jayess::value>& jayessArgs) {
  return jayess::font_load(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessFontSystemDefault(const std::vector<jayess::value>& jayessArgs) {
  return jayess::font_system_default(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1)
  );
}
