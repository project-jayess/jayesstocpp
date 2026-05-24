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
  return jayess::fs_exists_path_async(jayessFsString(pathText, "Jayess fs exists expects a string path"));
}

inline jayess::value jayessFsExistsSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_exists_path(jayessFsString(pathText, "Jayess fs exists expects a string path"));
}

inline jayess::value jayessFsReadText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_text_file_async(jayessFsString(pathText, "Jayess fs readText expects a string path"));
}

inline jayess::value jayessFsReadTextSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_text_file(jayessFsString(pathText, "Jayess fs readText expects a string path"));
}

inline jayess::value jayessFsReadBytes(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_bytes_file_async(jayessFsString(pathText, "Jayess fs readBytes expects a string path"));
}

inline jayess::value jayessFsReadBytesSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_read_bytes_file(jayessFsString(pathText, "Jayess fs readBytes expects a string path"));
}

inline jayess::value jayessFsWriteText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_write_text_file_async(
    jayessFsString(pathText, "Jayess fs writeText expects a string path"),
    jayessFsString(text, "Jayess fs writeText expects string content")
  );
}

inline jayess::value jayessFsWriteTextSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_write_text_file(
    jayessFsString(pathText, "Jayess fs writeText expects a string path"),
    jayessFsString(text, "Jayess fs writeText expects string content")
  );
}

inline jayess::value jayessFsWriteBytes(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_write_bytes_file_async(
    jayessFsString(pathText, "Jayess fs writeBytes expects a string path"),
    jayess::argument_at(jayessArgs, 1)
  );
}

inline jayess::value jayessFsWriteBytesSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_write_bytes_file(
    jayessFsString(pathText, "Jayess fs writeBytes expects a string path"),
    jayess::argument_at(jayessArgs, 1)
  );
}

inline jayess::value jayessFsAppendText(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_append_text_file_async(
    jayessFsString(pathText, "Jayess fs appendText expects a string path"),
    jayessFsString(text, "Jayess fs appendText expects string content")
  );
}

inline jayess::value jayessFsAppendTextSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  const auto text = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_append_text_file(
    jayessFsString(pathText, "Jayess fs appendText expects a string path"),
    jayessFsString(text, "Jayess fs appendText expects string content")
  );
}

inline jayess::value jayessFsCopy(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_copy_path_async(
    jayessFsString(fromPathText, "Jayess fs copy expects a string from path"),
    jayessFsString(toPathText, "Jayess fs copy expects a string to path")
  );
}

inline jayess::value jayessFsCopySync(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_copy_path(
    jayessFsString(fromPathText, "Jayess fs copy expects a string from path"),
    jayessFsString(toPathText, "Jayess fs copy expects a string to path")
  );
}

inline jayess::value jayessFsCopyRecursive(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_copy_path_recursive_async(
    jayessFsString(fromPathText, "Jayess fs copyRecursive expects a string from path"),
    jayessFsString(toPathText, "Jayess fs copyRecursive expects a string to path")
  );
}

inline jayess::value jayessFsCopyRecursiveSync(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_copy_path_recursive(
    jayessFsString(fromPathText, "Jayess fs copyRecursive expects a string from path"),
    jayessFsString(toPathText, "Jayess fs copyRecursive expects a string to path")
  );
}

inline jayess::value jayessFsCreateDirectories(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_create_directories_async(jayessFsString(pathText, "Jayess fs createDirectories expects a string path"));
}

inline jayess::value jayessFsCreateDirectoriesSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_create_directories(jayessFsString(pathText, "Jayess fs createDirectories expects a string path"));
}

inline jayess::value jayessFsRemove(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path_async(jayessFsString(pathText, "Jayess fs remove expects a string path"));
}

inline jayess::value jayessFsRemoveSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path(jayessFsString(pathText, "Jayess fs remove expects a string path"));
}

inline jayess::value jayessFsRemoveRecursive(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path_recursive_async(jayessFsString(pathText, "Jayess fs removeRecursive expects a string path"));
}

inline jayess::value jayessFsRemoveRecursiveSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_remove_path_recursive(jayessFsString(pathText, "Jayess fs removeRecursive expects a string path"));
}

inline jayess::value jayessFsList(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_list_directory_async(jayessFsString(pathText, "Jayess fs list expects a string path"));
}

inline jayess::value jayessFsListSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_list_directory(jayessFsString(pathText, "Jayess fs list expects a string path"));
}

inline jayess::value jayessFsWalk(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_walk_directory_async(jayessFsString(pathText, "Jayess fs walk expects a string path"));
}

inline jayess::value jayessFsWalkSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_walk_directory(jayessFsString(pathText, "Jayess fs walk expects a string path"));
}

inline jayess::value jayessFsRename(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_rename_path_async(
    jayessFsString(fromPathText, "Jayess fs rename expects a string from path"),
    jayessFsString(toPathText, "Jayess fs rename expects a string to path")
  );
}

inline jayess::value jayessFsRenameSync(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::fs_rename_path(
    jayessFsString(fromPathText, "Jayess fs rename expects a string from path"),
    jayessFsString(toPathText, "Jayess fs rename expects a string to path")
  );
}

inline jayess::value jayessFsStat(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_stat_path_async(jayessFsString(pathText, "Jayess fs stat expects a string path"));
}

inline jayess::value jayessFsStatSync(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::fs_stat_path(jayessFsString(pathText, "Jayess fs stat expects a string path"));
}
