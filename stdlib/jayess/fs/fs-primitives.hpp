#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::string jayessFsString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessFsExists(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_exists_path(jayessFsString(pathText, "Jayess fs exists expects a string path"));
}

inline jayess::value jayessFsReadText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_text_file(jayessFsString(pathText, "Jayess fs readText expects a string path"));
}

inline jayess::value jayessFsWriteText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_write_text_file(
    jayessFsString(pathText, "Jayess fs writeText expects a string path"),
    jayessFsString(text, "Jayess fs writeText expects string content")
  );
}

inline jayess::value jayessFsCreateDirectories(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_create_directories(jayessFsString(pathText, "Jayess fs createDirectories expects a string path"));
}

inline jayess::value jayessFsRemove(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path(jayessFsString(pathText, "Jayess fs remove expects a string path"));
}

inline jayess::value jayessFsList(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_list_directory(jayessFsString(pathText, "Jayess fs list expects a string path"));
}

inline jayess::value jayessFsRename(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_rename_path(
    jayessFsString(fromPathText, "Jayess fs rename expects a string from path"),
    jayessFsString(toPathText, "Jayess fs rename expects a string to path")
  );
}

inline jayess::value jayessFsStat(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_stat_path(jayessFsString(pathText, "Jayess fs stat expects a string path"));
}
