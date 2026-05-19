export function getPathRuntimeHeaderFragment() {
  return `value path_join_parts(const std::vector<std::string>& parts);
value path_dirname(const std::string& pathText);
value path_basename(const std::string& pathText);
value path_extname(const std::string& pathText);
value path_normalize(const std::string& pathText);
value path_resolve_parts(const std::vector<std::string>& parts);
value path_relative_between(const std::string& fromPathText, const std::string& toPathText);
value path_is_absolute(const std::string& pathText);`;
}

export function getPathRuntimeCppFragment() {
  return `namespace {
std::filesystem::path path_require_filesystem_path(const std::string& pathText) {
  return std::filesystem::path(pathText);
}

std::string path_string_value(const std::filesystem::path& pathValue) {
  return pathValue.generic_string();
}
} // namespace

value path_join_parts(const std::vector<std::string>& parts) {
  std::filesystem::path joined;
  for (const auto& part : parts) {
    joined /= std::filesystem::path(part);
  }
  return path_string_value(joined.lexically_normal());
}

value path_dirname(const std::string& pathText) {
  return path_string_value(path_require_filesystem_path(pathText).parent_path());
}

value path_basename(const std::string& pathText) {
  return path_string_value(path_require_filesystem_path(pathText).filename());
}

value path_extname(const std::string& pathText) {
  return path_string_value(path_require_filesystem_path(pathText).extension());
}

value path_normalize(const std::string& pathText) {
  return path_string_value(path_require_filesystem_path(pathText).lexically_normal());
}

value path_resolve_parts(const std::vector<std::string>& parts) {
  std::filesystem::path resolved;
  for (const auto& partText : parts) {
    const auto part = std::filesystem::path(partText);
    if (part.is_absolute()) {
      resolved = part;
      continue;
    }
    if (resolved.empty()) {
      resolved = std::filesystem::current_path() / part;
      continue;
    }
    resolved /= part;
  }
  if (resolved.empty()) {
    resolved = std::filesystem::current_path();
  }
  return path_string_value(resolved.lexically_normal());
}

value path_relative_between(const std::string& fromPathText, const std::string& toPathText) {
  return path_string_value(
    std::filesystem::relative(
      path_require_filesystem_path(toPathText),
      path_require_filesystem_path(fromPathText)
    ).lexically_normal()
  );
}

value path_is_absolute(const std::string& pathText) {
  return path_require_filesystem_path(pathText).is_absolute();
}`;
}
