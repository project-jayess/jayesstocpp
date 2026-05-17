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
