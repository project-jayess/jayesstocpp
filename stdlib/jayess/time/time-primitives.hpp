#pragma once

#include "runtime/jayess_runtime.hpp"

inline void jayessTimeRequireExactArgs(
  const std::vector<jayess::value>& jayessArgs,
  std::size_t expected,
  const std::string& message
) {
  if (jayessArgs.size() != expected) {
    throw std::runtime_error(message);
  }
}

inline jayess::value jayessTimeMillis(const std::vector<jayess::value>& jayessArgs) {
  jayessTimeRequireExactArgs(jayessArgs, 0, "Jayess time millis expects no arguments");
  return jayess::time_millis();
}

inline jayess::value jayessTimeSeconds(const std::vector<jayess::value>& jayessArgs) {
  jayessTimeRequireExactArgs(jayessArgs, 1, "Jayess time seconds expects exactly one argument");
  return jayess::time_seconds(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeMinutes(const std::vector<jayess::value>& jayessArgs) {
  jayessTimeRequireExactArgs(jayessArgs, 1, "Jayess time minutes expects exactly one argument");
  return jayess::time_minutes(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeElapsed(const std::vector<jayess::value>& jayessArgs) {
  jayessTimeRequireExactArgs(jayessArgs, 1, "Jayess time elapsed expects exactly one argument");
  return jayess::time_elapsed(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeFormatDuration(const std::vector<jayess::value>& jayessArgs) {
  jayessTimeRequireExactArgs(jayessArgs, 1, "Jayess time formatDuration expects exactly one argument");
  return jayess::time_format_duration(jayess::argument_at(jayessArgs, 0));
}
