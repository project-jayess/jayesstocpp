#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessClipboardReadText(const std::vector<jayess::value>&) {
  return jayess::clipboard_read_text();
}

inline jayess::value jayessClipboardWriteText(const std::vector<jayess::value>& jayessArgs) {
  return jayess::clipboard_write_text(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessClipboardClear(const std::vector<jayess::value>&) {
  return jayess::clipboard_clear();
}
