#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::string jayessConsoleStringArgument(const std::vector<jayess::value>& jayessArgs, std::size_t index, const std::string& message) {
  const auto input = jayess::argument_at(jayessArgs, index);
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessConsoleLog(const std::vector<jayess::value>& jayessArgs) {
  return jayess::console_log_value(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessConsoleError(const std::vector<jayess::value>& jayessArgs) {
  return jayess::console_error_value(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessConsoleWrite(const std::vector<jayess::value>& jayessArgs) {
  return jayess::console_write_text(
    jayessConsoleStringArgument(jayessArgs, 0, "Jayess console write expects a string text value")
  );
}

inline jayess::value jayessConsoleWriteLine(const std::vector<jayess::value>& jayessArgs) {
  return jayess::console_write_line_text(
    jayessConsoleStringArgument(jayessArgs, 0, "Jayess console writeLine expects a string text value")
  );
}

inline jayess::value jayessConsoleReadLine(const std::vector<jayess::value>&) {
  return jayess::console_read_line_text();
}

inline jayess::value jayessConsoleReadStdin(const std::vector<jayess::value>&) {
  return jayess::console_read_stdin_text();
}

inline jayess::value jayessConsolePrompt(const std::vector<jayess::value>& jayessArgs) {
  return jayess::console_prompt_text(
    jayessConsoleStringArgument(jayessArgs, 0, "Jayess console prompt expects a string text value")
  );
}
