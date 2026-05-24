#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline int jayessTimersIntegerArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
  const auto input = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }

  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || numeric < 0.0 || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline jayess::value jayessTimersRequireArgsArray(const std::vector<jayess::value>& jayessArgs, std::size_t index) {
  const auto args = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<jayess::array_ptr>(args)) {
    throw std::runtime_error("jayess:timers args must be an array");
  }
  return args;
}

inline jayess::value jayessTimersRequireHandle(const std::vector<jayess::value>& jayessArgs, std::size_t index) {
  const auto handle = jayess::argument_at(jayessArgs, index);
  const auto cancelled = jayess::get_property(handle, "cancelled");
  if (!std::holds_alternative<bool>(cancelled)) {
    throw std::runtime_error("jayess:timers expected a timer handle");
  }
  return handle;
}

inline jayess::value jayessTimersSleep(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_sleep(jayess::value(static_cast<double>(jayessTimersIntegerArgument(
    jayessArgs,
    0,
    "jayess:timers duration must be non-negative"
  ))));
}

inline jayess::value jayessTimersSetTimeout(const std::vector<jayess::value>& jayessArgs) {
  const auto callback = jayess::argument_at(jayessArgs, 0);
  const auto milliseconds = jayessTimersIntegerArgument(jayessArgs, 1, "jayess:timers duration must be non-negative");
  const auto args = jayessTimersRequireArgsArray(jayessArgs, 2);
  auto handle = jayess::make_object({
    {"cancelled", jayess::value(false)},
    {"done", jayess::value(std::monostate{})}
  });
  jayess::set_property(handle, "done", jayess::timer_schedule_once(callback, milliseconds, args, handle));
  return handle;
}

inline jayess::value jayessTimersClearTimeout(const std::vector<jayess::value>& jayessArgs) {
  const auto handle = jayessTimersRequireHandle(jayessArgs, 0);
  jayess::set_property(handle, "cancelled", jayess::value(true));
  return jayess::value(std::monostate{});
}

inline jayess::value jayessTimersSetInterval(const std::vector<jayess::value>& jayessArgs) {
  const auto callback = jayess::argument_at(jayessArgs, 0);
  const auto milliseconds = jayessTimersIntegerArgument(jayessArgs, 1, "jayess:timers duration must be non-negative");
  const auto args = jayessTimersRequireArgsArray(jayessArgs, 2);
  auto handle = jayess::make_object({
    {"cancelled", jayess::value(false)},
    {"done", jayess::value(std::monostate{})}
  });
  jayess::set_property(handle, "done", jayess::timer_schedule_interval(callback, milliseconds, args, handle));
  return handle;
}

inline jayess::value jayessTimersClearInterval(const std::vector<jayess::value>& jayessArgs) {
  const auto handle = jayessTimersRequireHandle(jayessArgs, 0);
  jayess::set_property(handle, "cancelled", jayess::value(true));
  return jayess::value(std::monostate{});
}
