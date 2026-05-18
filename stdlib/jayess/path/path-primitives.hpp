#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessPathJoin(const std::vector<jayess::value>& jayessArgs) {
  std::vector<std::string> parts;
  parts.reserve(jayessArgs.size());
  for (const auto& value : jayessArgs) {
    parts.push_back(std::get<std::string>(value));
  }
  return jayess::path_join_parts(parts);
}

inline jayess::value jayessPathDirname(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_dirname(std::get<std::string>(pathText));
}

inline jayess::value jayessPathBasename(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_basename(std::get<std::string>(pathText));
}

inline jayess::value jayessPathExtname(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_extname(std::get<std::string>(pathText));
}

inline jayess::value jayessPathNormalize(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_normalize(std::get<std::string>(pathText));
}

inline jayess::value jayessPathResolve(const std::vector<jayess::value>& jayessArgs) {
  std::vector<std::string> parts;
  parts.reserve(jayessArgs.size());
  for (const auto& value : jayessArgs) {
    parts.push_back(std::get<std::string>(value));
  }
  return jayess::path_resolve_parts(parts);
}

inline jayess::value jayessPathRelative(const std::vector<jayess::value>& jayessArgs) {
  const auto fromPathText = jayess::argument_at(jayessArgs, 0);
  const auto toPathText = jayess::argument_at(jayessArgs, 1);
  return jayess::path_relative_between(
    std::get<std::string>(fromPathText),
    std::get<std::string>(toPathText)
  );
}

inline jayess::value jayessPathIsAbsolute(const std::vector<jayess::value>& jayessArgs) {
  const auto pathText = jayess::argument_at(jayessArgs, 0);
  return jayess::path_is_absolute(std::get<std::string>(pathText));
}
