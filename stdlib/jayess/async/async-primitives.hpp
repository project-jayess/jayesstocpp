#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessAsyncResolved(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::make_resolved_async(input);
}

inline jayess::value jayessAsyncRejected(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::make_rejected_async(input);
}

inline jayess::value jayessAsyncAll(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_all(handles);
}

inline jayess::value jayessAsyncAllSettled(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_all_settled(handles);
}

inline jayess::value jayessAsyncAny(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_any(handles);
}

inline jayess::value jayessAsyncRace(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_race(handles);
}

inline jayess::value jayessAsyncIsAsync(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_async(input));
}
