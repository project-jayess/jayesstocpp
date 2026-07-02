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

inline jayess::value jayessFontGlyphRows(const std::vector<jayess::value>& jayessArgs) {
  if (jayessArgs.size() == 3) {
    auto fontValue = jayess::argument_at(jayessArgs, 0);
    if (!std::holds_alternative<jayess::object_ptr>(fontValue)) {
      throw std::runtime_error("Jayess font glyphRows expects a font object");
    }
    auto copy = std::make_shared<jayess::object_value>(*std::get<jayess::object_ptr>(fontValue));
    copy->fields["charWidth"] = jayess::argument_at(jayessArgs, 2);
    copy->fields["charHeight"] = jayess::argument_at(jayessArgs, 2);
    return jayess::font_glyph_rows(
      jayess::value(copy),
      jayess::argument_at(jayessArgs, 1)
    );
  }
  return jayess::font_glyph_rows(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1)
  );
}

inline jayess::value jayessFontSystemDefault(const std::vector<jayess::value>& jayessArgs) {
  return jayess::font_system_default(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1)
  );
}
