#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessUrlRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline jayess::value jayessUrlParse(const std::vector<jayess::value>& jayessArgs) {
  jayessUrlRequireExactArgs(jayessArgs, 1, "Jayess url parse expects exactly one argument");
  return jayess::url_parse_text(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessUrlFormat(const std::vector<jayess::value>& jayessArgs) {
  jayessUrlRequireExactArgs(jayessArgs, 1, "Jayess url format expects exactly one argument");
  return jayess::url_format_parts(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessUrlJoinPath(const std::vector<jayess::value>& jayessArgs) {
  jayessUrlRequireExactArgs(jayessArgs, 2, "Jayess url joinPath expects exactly two arguments");
  return jayess::url_join_path(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessUrlGetQuery(const std::vector<jayess::value>& jayessArgs) {
  jayessUrlRequireExactArgs(jayessArgs, 2, "Jayess url getQuery expects exactly two arguments");
  return jayess::url_get_query(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessUrlSetQuery(const std::vector<jayess::value>& jayessArgs) {
  jayessUrlRequireExactArgs(jayessArgs, 3, "Jayess url setQuery expects exactly three arguments");
  return jayess::url_set_query(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}
