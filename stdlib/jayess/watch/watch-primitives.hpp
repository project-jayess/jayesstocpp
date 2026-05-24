#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessWatchCreate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::watch_create(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessWatchPoll(const std::vector<jayess::value>& jayessArgs) {
  return jayess::watch_poll(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWatchClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::watch_close(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWatchIsWatcher(const std::vector<jayess::value>& jayessArgs) {
  return jayess::is_watch_value(jayess::argument_at(jayessArgs, 0));
}
