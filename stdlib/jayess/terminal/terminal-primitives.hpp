#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessTerminalAnsi(const std::vector<jayess::value>& jayessArgs) {
  return jayess::terminal_ansi(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTerminalStripAnsi(const std::vector<jayess::value>& jayessArgs) {
  return jayess::terminal_strip_ansi(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessTerminalCursorTo(const std::vector<jayess::value>& jayessArgs) {
  return jayess::terminal_cursor_to(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessTerminalClearScreen(const std::vector<jayess::value>&) {
  return jayess::terminal_clear_screen();
}

inline jayess::value jayessTerminalClearLine(const std::vector<jayess::value>&) {
  return jayess::terminal_clear_line();
}

inline jayess::value jayessTerminalSize(const std::vector<jayess::value>&) {
  return jayess::terminal_size();
}
