#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessJsonParse(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  return jayess::json_parse_text(std::get<std::string>(text));
}

inline jayess::value jayessJsonStringify(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::json_stringify_value(input);
}

inline jayess::value jayessIsJsonText(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_json_text(std::get<std::string>(text)));
}
