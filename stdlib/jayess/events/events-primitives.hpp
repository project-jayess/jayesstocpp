#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::string jayessEventsName(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessEventsCreate(const std::vector<jayess::value>&) {
  return jayess::events_create();
}

inline jayess::value jayessEventsOn(const std::vector<jayess::value>& jayessArgs) {
  return jayess::events_on(
    jayess::argument_at(jayessArgs, 0),
    jayessEventsName(jayess::argument_at(jayessArgs, 1), "Jayess events on expects a string event name"),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessEventsOnce(const std::vector<jayess::value>& jayessArgs) {
  return jayess::events_once(
    jayess::argument_at(jayessArgs, 0),
    jayessEventsName(jayess::argument_at(jayessArgs, 1), "Jayess events once expects a string event name"),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessEventsOff(const std::vector<jayess::value>& jayessArgs) {
  return jayess::events_off(
    jayess::argument_at(jayessArgs, 0),
    jayessEventsName(jayess::argument_at(jayessArgs, 1), "Jayess events off expects a string event name"),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessEventsEmit(const std::vector<jayess::value>& jayessArgs) {
  return jayess::events_emit(
    jayess::argument_at(jayessArgs, 0),
    jayessEventsName(jayess::argument_at(jayessArgs, 1), "Jayess events emit expects a string event name"),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessEventsListenerCount(const std::vector<jayess::value>& jayessArgs) {
  return jayess::events_listener_count(
    jayess::argument_at(jayessArgs, 0),
    jayessEventsName(jayess::argument_at(jayessArgs, 1), "Jayess events listenerCount expects a string event name")
  );
}
