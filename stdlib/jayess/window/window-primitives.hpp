#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessWindowCreate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_create(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowShow(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_show(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowHide(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_hide(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowFrame(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_frame(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
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

inline jayess::value jayessWindowAddEventListener(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_add_event_listener(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1), jayess::argument_at(jayessArgs, 2));
}

inline jayess::value jayessWindowRemoveEventListener(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_remove_event_listener(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1), jayess::argument_at(jayessArgs, 2));
}

inline jayess::value jayessWindowDispatchEvents(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_dispatch_events(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowRun(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_run(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowSetFps(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_set_fps(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessWindowCurrentFps(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_current_fps(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessWindowPresent(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_present(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessWindowRequestRender(const std::vector<jayess::value>& jayessArgs) {
  return jayess::window_request_render(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
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
