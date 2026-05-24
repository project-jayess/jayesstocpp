#pragma once

#include "runtime/jayess_runtime.hpp"

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
  return jayess::bytes_from_utf8(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesFromArray(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_from_array(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesToArray(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_to_array(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesToUtf8(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_to_utf8(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesLength(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_length(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessBytesGet(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_get(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesSet(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_set(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessBytesFill(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_fill(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesSlice(const std::vector<jayess::value>& jayessArgs) {
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
  return jayess::bytes_concat(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesEquals(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_equals(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesCompare(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_compare(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesStartsWith(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_starts_with(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesEndsWith(const std::vector<jayess::value>& jayessArgs) {
  return jayess::bytes_ends_with(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessBytesIsBytes(const std::vector<jayess::value>& jayessArgs) {
  return jayess::is_bytes_value(jayess::argument_at(jayessArgs, 0));
}
