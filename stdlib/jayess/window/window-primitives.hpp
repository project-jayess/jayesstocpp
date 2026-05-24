#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessWindowCreate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_create(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowShow(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_show(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_close(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowShouldClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_should_close(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowRequestClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_request_close(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowPollEvents(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_poll_events(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowPresent(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_present(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessWindowWidth(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_width(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowHeight(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_height(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowSetTitle(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_set_title(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}
