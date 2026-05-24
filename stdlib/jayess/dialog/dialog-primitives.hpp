#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessDialogOpenFile(const std::vector<jayess::value>& jayessArgs) {
  return jayess::dialog_open_file_async(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessDialogSaveFile(const std::vector<jayess::value>& jayessArgs) {
  return jayess::dialog_save_file_async(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessDialogOpenDirectory(const std::vector<jayess::value>& jayessArgs) {
  return jayess::dialog_open_directory_async(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessDialogMessage(const std::vector<jayess::value>& jayessArgs) {
  return jayess::dialog_message_async(jayess::argument_at(jayessArgs, 0));
}
