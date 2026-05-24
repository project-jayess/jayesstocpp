#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessTimeMillis(const std::vector<jayess::value>&) {
  return jayess::time_millis();
}

inline jayess::value jayessTimeSeconds(const std::vector<jayess::value>& jayessArgs) {
  return jayess::time_seconds(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeMinutes(const std::vector<jayess::value>& jayessArgs) {
  return jayess::time_minutes(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeElapsed(const std::vector<jayess::value>& jayessArgs) {
  return jayess::time_elapsed(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTimeFormatDuration(const std::vector<jayess::value>& jayessArgs) {
  return jayess::time_format_duration(jayess::argument_at(jayessArgs, 0));
}
