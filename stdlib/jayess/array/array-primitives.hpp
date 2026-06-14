#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessArrayRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline std::vector<jayess::value> jayessArrayOptionalRestArgs(
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

inline jayess::value jayessArraySlice(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 3, "Jayess array slice expects exactly two or three arguments");
  std::vector<jayess::value> args = {jayess::argument_at(jayessArgs, 1)};
  auto endArgs = jayessArrayOptionalRestArgs(jayessArgs, 2, "Jayess array slice expects optional end arguments");
  if (endArgs.size() > 1) {
    throw std::runtime_error("Jayess array slice expects at most one end argument");
  }
  if (!endArgs.empty()) {
    args.push_back(endArgs[0]);
  }
  return jayess::array_slice(jayess::argument_at(jayessArgs, 0), args);
}

inline jayess::value jayessArrayConcat(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array concat expects exactly two arguments");
  return jayess::array_concat(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayIsArray(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 1, "Jayess array isArray expects exactly one argument");
  return std::holds_alternative<jayess::array_ptr>(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArrayIndexOf(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array indexOf expects exactly two arguments");
  return jayess::array_index_of(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayFind(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array find expects exactly two arguments");
  return jayess::array_find(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayFindIndex(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array findIndex expects exactly two arguments");
  return jayess::array_find_index(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArraySome(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array some expects exactly two arguments");
  return jayess::array_some(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayEvery(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array every expects exactly two arguments");
  return jayess::array_every(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayIncludes(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array includes expects exactly two arguments");
  const auto items = jayess::argument_at(jayessArgs, 0);
  const auto needle = jayess::argument_at(jayessArgs, 1);
  return jayess::array_includes(items, {needle});
}

inline jayess::value jayessArrayJoin(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array join expects one or two arguments");
  auto separatorArgs = jayessArrayOptionalRestArgs(jayessArgs, 1, "Jayess array join expects optional separator arguments");
  if (separatorArgs.size() > 1) {
    throw std::runtime_error("Jayess array join expects at most one separator argument");
  }
  return jayess::array_join(jayess::argument_at(jayessArgs, 0), separatorArgs);
}

inline jayess::value jayessArrayReverse(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 1, "Jayess array reverse expects exactly one argument");
  return jayess::array_reverse(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArraySort(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array sort expects one or two arguments");
  auto comparatorArgs = jayessArrayOptionalRestArgs(jayessArgs, 1, "Jayess array sort expects optional comparator arguments");
  return jayess::array_sort(jayess::argument_at(jayessArgs, 0), comparatorArgs);
}

inline jayess::value jayessArrayMap(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array map expects exactly two arguments");
  return jayess::array_map(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayFilter(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 2, "Jayess array filter expects exactly two arguments");
  return jayess::array_filter(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArrayReduce(const std::vector<jayess::value>& jayessArgs) {
  jayessArrayRequireExactArgs(jayessArgs, 3, "Jayess array reduce expects exactly three arguments");
  return jayess::array_reduce(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}
