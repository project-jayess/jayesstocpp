#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessProcessCwd(const std::vector<jayess::value>&) {
  return jayess::process_current_working_directory();
}

inline jayess::value jayessProcessGetEnv(const std::vector<jayess::value>& jayessArgs) {
  const auto key = jayess::argument_at(jayessArgs, 0);
  return jayess::process_get_env(std::get<std::string>(key));
}

inline jayess::value jayessProcessArgv(const std::vector<jayess::value>&) {
  return jayess::process_get_argv();
}

inline jayess::value jayessProcessExit(const std::vector<jayess::value>& jayessArgs) {
  const auto code = jayess::argument_at(jayessArgs, 0);
  jayess::process_exit_with_code(static_cast<int>(std::get<double>(code)));
}
