export function getPathRuntimeHeaderFragment() {
  return `value path_join_parts(const std::vector<std::string>& parts);
value path_dirname(const std::string& pathText);
value path_basename(const std::string& pathText);
value path_extname(const std::string& pathText);
value path_normalize(const std::string& pathText);
value path_parse(const std::string& pathText);
value path_format(const value& parts);
value path_separator();
value path_delimiter();
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

std::string path_object_string_field(const object_ptr& object, const std::string& key) {
  const auto iterator = object->fields.find(key);
  if (iterator == object->fields.end() || std::holds_alternative<std::monostate>(iterator->second)) {
    return "";
  }
  if (!std::holds_alternative<std::string>(iterator->second)) {
    throw std::runtime_error("Jayess path format expects string fields");
  }
  return std::get<std::string>(iterator->second);
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

value path_parse(const std::string& pathText) {
  const auto parsed = path_require_filesystem_path(pathText);
  return make_object({
    {"root", path_string_value(parsed.root_path())},
    {"dir", path_string_value(parsed.parent_path())},
    {"base", path_string_value(parsed.filename())},
    {"ext", path_string_value(parsed.extension())},
    {"name", path_string_value(parsed.stem())}
  });
}

value path_format(const value& parts) {
  if (!std::holds_alternative<object_ptr>(parts)) {
    throw std::runtime_error("Jayess path format expects an object");
  }
  const auto& object = std::get<object_ptr>(parts);
  const auto dir = path_object_string_field(object, "dir");
  const auto root = path_object_string_field(object, "root");
  const auto base = path_object_string_field(object, "base");
  const auto name = path_object_string_field(object, "name");
  const auto ext = path_object_string_field(object, "ext");

  std::filesystem::path result = !dir.empty() ? std::filesystem::path(dir) : std::filesystem::path(root);
  const auto filename = !base.empty() ? base : name + ext;
  if (!filename.empty()) {
    result /= filename;
  }
  return path_string_value(result.lexically_normal());
}

value path_separator() {
#ifdef _WIN32
  return value(std::string("\\\\"));
#else
  return value(std::string("/"));
#endif
}

value path_delimiter() {
#ifdef _WIN32
  return value(std::string(";"));
#else
  return value(std::string(":"));
#endif
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
