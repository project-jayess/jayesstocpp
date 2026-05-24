#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::string jayessSubprocessStringArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
  const auto input = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessSubprocessOptionsArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index) {
  if (!jayess::has_argument(jayessArgs, index)) {
    return jayess::value(std::monostate{});
  }
  return jayess::argument_at(jayessArgs, index);
}

inline jayess::value jayessSubprocessRun(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_run_async(
    jayessSubprocessStringArgument(jayessArgs, 0, "Jayess subprocess run expects a string command"),
    jayess::argument_at(jayessArgs, 1),
    jayessSubprocessOptionsArgument(jayessArgs, 2)
  );
}

inline jayess::value jayessSubprocessSpawn(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_spawn(
    jayessSubprocessStringArgument(jayessArgs, 0, "Jayess subprocess spawn expects a string command"),
    jayess::argument_at(jayessArgs, 1),
    jayessSubprocessOptionsArgument(jayessArgs, 2)
  );
}

inline jayess::value jayessSubprocessJoin(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_join(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessSubprocessKill(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_kill(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessSubprocessStdout(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_stdout_stream(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessSubprocessStderr(const std::vector<jayess::value>& jayessArgs) {
  return jayess::subprocess_stderr_stream(jayess::argument_at(jayessArgs, 0));
}
