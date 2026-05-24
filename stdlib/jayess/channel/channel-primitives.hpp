#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessChannelCreate(const std::vector<jayess::value>&) {
  return jayess::channel_create();
}

inline jayess::value jayessChannelSend(const std::vector<jayess::value>& jayessArgs) {
  return jayess::channel_send(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessChannelReceive(const std::vector<jayess::value>& jayessArgs) {
  return jayess::channel_receive(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessChannelClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::channel_close(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessChannelIsClosed(const std::vector<jayess::value>& jayessArgs) {
  return jayess::channel_is_closed(jayess::argument_at(jayessArgs, 0));
}
