#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline std::string jayessProcessString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline int jayessProcessInteger(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline jayess::value jayessProcessCwd(const std::vector<jayess::value>&) {
  return jayess::process_current_working_directory();
}

inline jayess::value jayessProcessGetEnv(const std::vector<jayess::value>& jayessArgs) {
  const auto key = jayess::argument_at(jayessArgs, 0);
  return jayess::process_get_env(jayessProcessString(key, "Jayess process getEnv expects a string key"));
}

inline jayess::value jayessProcessHasEnv(const std::vector<jayess::value>& jayessArgs) {
  const auto key = jayess::argument_at(jayessArgs, 0);
  return jayess::process_has_env(jayessProcessString(key, "Jayess process hasEnv expects a string key"));
}

inline jayess::value jayessProcessEnvKeys(const std::vector<jayess::value>&) {
  return jayess::process_env_keys();
}

inline jayess::value jayessProcessEnvEntries(const std::vector<jayess::value>&) {
  return jayess::process_env_entries();
}

inline jayess::value jayessProcessArgv(const std::vector<jayess::value>&) {
  return jayess::process_get_argv();
}

inline jayess::value jayessProcessExit(const std::vector<jayess::value>& jayessArgs) {
  const auto code = jayess::argument_at(jayessArgs, 0);
  jayess::process_exit_with_code(jayessProcessInteger(code, "Jayess process exit expects an integer code"));
}
