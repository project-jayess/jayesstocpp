#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessIterNext(const std::vector<jayess::value>& jayessArgs) {
  const auto sent = jayess::has_argument(jayessArgs, 1)
    ? jayess::argument_at(jayessArgs, 1)
    : jayess::value(std::monostate{});
  return jayess::iter_next(jayess::argument_at(jayessArgs, 0), sent);
}

inline jayess::value jayessIterToArray(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_to_array(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessIterTake(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_take(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterMap(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_map(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterFilter(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_filter(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterForEach(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_for_each(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterReduce(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_reduce(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessIterSome(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_some(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterEvery(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_every(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterFind(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_find(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterChain(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_chain(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessIterRange(const std::vector<jayess::value>& jayessArgs) {
  return jayess::iter_range(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}
