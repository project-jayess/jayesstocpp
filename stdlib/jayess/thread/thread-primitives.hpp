#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline int jayessThreadIntegerArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
  const auto input = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }

  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline jayess::value jayessThreadSpawn(const std::vector<jayess::value>& jayessArgs) {
  const auto callback = jayess::argument_at(jayessArgs, 0);
  const auto args = jayess::argument_at(jayessArgs, 1);
  return jayess::thread_spawn(callback, args);
}

inline jayess::value jayessThreadJoin(const std::vector<jayess::value>& jayessArgs) {
  const auto handle = jayess::argument_at(jayessArgs, 0);
  return jayess::thread_join(handle);
}

inline jayess::value jayessThreadSleep(const std::vector<jayess::value>& jayessArgs) {
  return jayess::thread_sleep_for_milliseconds(
    jayessThreadIntegerArgument(jayessArgs, 0, "Jayess thread sleep expects a non-negative integer")
  );
}

inline jayess::value jayessThreadHardwareConcurrency(const std::vector<jayess::value>&) {
  return jayess::thread_hardware_concurrency();
}

inline jayess::value jayessThreadCurrentId(const std::vector<jayess::value>&) {
  return jayess::thread_current_id();
}
