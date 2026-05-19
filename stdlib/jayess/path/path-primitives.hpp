#pragma once

#include "runtime/jayess_runtime.hpp"

inline std::string jayessPathString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessPathJoin(const std::vector<jayess::value>& jayessArgs) {
  std::vector<std::string> parts;
  parts.reserve(jayessArgs.size());
  for (const auto& value : jayessArgs) {
    parts.push_back(jayessPathString(value, "Jayess path join expects string parts"));
  }
  return jayess::path_join_parts(parts);
}

inline jayess::value jayessPathDirname(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_dirname(jayessPathString(pathText, "Jayess path dirname expects a string path"));
}

inline jayess::value jayessPathBasename(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_basename(jayessPathString(pathText, "Jayess path basename expects a string path"));
}

inline jayess::value jayessPathExtname(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_extname(jayessPathString(pathText, "Jayess path extname expects a string path"));
}

inline jayess::value jayessPathNormalize(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_normalize(jayessPathString(pathText, "Jayess path normalize expects a string path"));
}

inline jayess::value jayessPathResolve(const std::vector<jayess::value>& jayessArgs) {
  std::vector<std::string> parts;
  parts.reserve(jayessArgs.size());
  for (const auto& value : jayessArgs) {
    parts.push_back(jayessPathString(value, "Jayess path resolve expects string parts"));
  }
  return jayess::path_resolve_parts(parts);
}

inline jayess::value jayessPathRelative(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::path_relative_between(
    jayessPathString(fromPathText, "Jayess path relative expects a string from path"),
    jayessPathString(toPathText, "Jayess path relative expects a string to path")
  );
}

inline jayess::value jayessPathIsAbsolute(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_is_absolute(jayessPathString(pathText, "Jayess path isAbsolute expects a string path"));
}
