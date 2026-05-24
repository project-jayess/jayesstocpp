#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessBytesRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline std::vector<jayess::value> jayessBytesOptionalRestArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t restIndex,
  const std::string& message
) {
  const auto rest = jayess::argument_at(jayessArgs, restIndex);
  if (!std::holds_alternative<jayess::array_ptr>(rest)) {
    throw std::runtime_error(message);
  }
  return std::get<jayess::array_ptr>(rest)->items;
}

inline jayess::value jayessBytesFromUtf8(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes fromUtf8 expects exactly one argument");
  return jayess::bytes_from_utf8(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesFromArray(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes fromArray expects exactly one argument");
  return jayess::bytes_from_array(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesToArray(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes toArray expects exactly one argument");
  return jayess::bytes_to_array(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesToUtf8(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes toUtf8 expects exactly one argument");
  return jayess::bytes_to_utf8(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesLength(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes length expects exactly one argument");
  return jayess::bytes_length(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesGet(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes get expects exactly two arguments");
  return jayess::bytes_get(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesSet(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 3, "Jayess bytes set expects exactly three arguments");
  return jayess::bytes_set(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessBytesFill(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes fill expects exactly two arguments");
  return jayess::bytes_fill(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesSlice(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 3, "Jayess bytes slice expects two or three arguments");
  std::vector<jayess::value> args = {jayess::argument_at(jayessArgs, 1)};
  auto endArgs = jayessBytesOptionalRestArgs(jayessArgs, 2, "Jayess bytes slice expects optional end arguments");
  if (endArgs.size() > 1) {
    throw std::runtime_error("Jayess bytes slice expects at most one end argument");
  }
  if (!endArgs.empty()) {
    args.push_back(endArgs[0]);
  }
  return jayess::bytes_slice(jayess::argument_at(jayessArgs, 0), args);
}

inline jayess::value jayessBytesConcat(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes concat expects exactly two arguments");
  return jayess::bytes_concat(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesEquals(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes equals expects exactly two arguments");
  return jayess::bytes_equals(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesSecureEquals(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes secureEquals expects exactly two arguments");
  return jayess::bytes_secure_equals(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesCompare(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes compare expects exactly two arguments");
  return jayess::bytes_compare(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesStartsWith(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes startsWith expects exactly two arguments");
  return jayess::bytes_starts_with(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesEndsWith(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 2, "Jayess bytes endsWith expects exactly two arguments");
  return jayess::bytes_ends_with(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesIsBytes(const std::vector<jayess::value>& jayessArgs) {
  jayessBytesRequireExactArgs(jayessArgs, 1, "Jayess bytes isBytes expects exactly one argument");
  return jayess::is_bytes_value(jayess::argument_at(jayessArgs, 0));
}
