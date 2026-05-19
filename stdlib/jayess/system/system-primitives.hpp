#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline std::string jayessSystemStringArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
  const auto input = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline int jayessSystemIntegerArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
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

inline jayess::value jayessSystemArgs(const std::vector<jayess::value>&) {
  return jayess::process_get_argv();
}

inline jayess::value jayessSystemCwd(const std::vector<jayess::value>&) {
  return jayess::process_current_working_directory();
}

inline jayess::value jayessSystemGetEnv(const std::vector<jayess::value>& jayessArgs) {
  return jayess::process_get_env(
    jayessSystemStringArgument(jayessArgs, 0, "Jayess system getEnv expects a string name")
  );
}

inline jayess::value jayessSystemHasEnv(const std::vector<jayess::value>& jayessArgs) {
  return jayess::process_has_env(
    jayessSystemStringArgument(jayessArgs, 0, "Jayess system hasEnv expects a string name")
  );
}

inline jayess::value jayessSystemExitCode(const std::vector<jayess::value>& jayessArgs) {
  return jayess::process_set_exit_code(
    jayessSystemIntegerArgument(jayessArgs, 0, "Jayess system exitCode expects an integer value")
  );
}
