#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessUrlParse(const std::vector<jayess::value>& jayessArgs) {
  return jayess::url_parse_text(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessUrlFormat(const std::vector<jayess::value>& jayessArgs) {
  return jayess::url_format_parts(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessUrlJoinPath(const std::vector<jayess::value>& jayessArgs) {
  return jayess::url_join_path(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessUrlGetQuery(const std::vector<jayess::value>& jayessArgs) {
  return jayess::url_get_query(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessUrlSetQuery(const std::vector<jayess::value>& jayessArgs) {
  return jayess::url_set_query(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}
