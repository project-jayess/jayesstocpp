#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessFsExists(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_exists_path(std::get<std::string>(pathText));
}

inline jayess::value jayessFsReadText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_text_file(std::get<std::string>(pathText));
}

inline jayess::value jayessFsWriteText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_write_text_file(std::get<std::string>(pathText), std::get<std::string>(text));
}

inline jayess::value jayessFsCreateDirectories(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_create_directories(std::get<std::string>(pathText));
}

inline jayess::value jayessFsRemove(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path(std::get<std::string>(pathText));
}

inline jayess::value jayessFsList(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_list_directory(std::get<std::string>(pathText));
}

inline jayess::value jayessFsRename(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_rename_path(
    std::get<std::string>(fromPathText),
    std::get<std::string>(toPathText)
  );
}

inline jayess::value jayessFsStat(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_stat_path(std::get<std::string>(pathText));
}
