export function getSystemRuntimeHeaderFragment() {
  return `value fs_exists_path(const std::string& pathText);
value fs_read_text_file(const std::string& pathText);
value fs_write_text_file(const std::string& pathText, const std::string& text);
value fs_create_directories(const std::string& pathText);
value path_join_parts(const std::vector<std::string>& parts);
value path_dirname(const std::string& pathText);
value path_basename(const std::string& pathText);
value path_extname(const std::string& pathText);
value path_normalize(const std::string& pathText);
value process_current_working_directory();
value process_get_env(const std::string& key);
[[noreturn]] void process_exit_with_code(int code);`;
}

export function getSystemRuntimeCppFragment() {
  return `namespace {
std::filesystem::path require_filesystem_path(const std::string& pathText) {
  return std::filesystem::path(pathText);
}

std::string path_string_value(const std::filesystem::path& pathValue) {
  return pathValue.generic_string();
}
} // namespace

value fs_exists_path(const std::string& pathText) {
  return std::filesystem::exists(require_filesystem_path(pathText));
}

value fs_read_text_file(const std::string& pathText) {
  std::ifstream stream(require_filesystem_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to read file");
  }

  std::ostringstream content;
  content << stream.rdbuf();
  return content.str();
}

value fs_write_text_file(const std::string& pathText, const std::string& text) {
  std::ofstream stream(require_filesystem_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to write file");
  }

  stream << text;
  if (!stream) {
    throw std::runtime_error("Unable to write file");
  }

  return value(std::monostate{});
}

value fs_create_directories(const std::string& pathText) {
  return std::filesystem::create_directories(require_filesystem_path(pathText));
}

value path_join_parts(const std::vector<std::string>& parts) {
  std::filesystem::path joined;
  for (const auto& part : parts) {
    joined /= std::filesystem::path(part);
  }
  return path_string_value(joined.lexically_normal());
}

value path_dirname(const std::string& pathText) {
  return path_string_value(require_filesystem_path(pathText).parent_path());
}

value path_basename(const std::string& pathText) {
  return path_string_value(require_filesystem_path(pathText).filename());
}

value path_extname(const std::string& pathText) {
  return path_string_value(require_filesystem_path(pathText).extension());
}

value path_normalize(const std::string& pathText) {
  return path_string_value(require_filesystem_path(pathText).lexically_normal());
}

value process_current_working_directory() {
  return path_string_value(std::filesystem::current_path());
}

value process_get_env(const std::string& key) {
  const auto* envValue = std::getenv(key.c_str());
  if (envValue == nullptr) {
    return value(std::monostate{});
  }
  return std::string(envValue);
}

void process_exit_with_code(int code) {
  std::exit(code);
}`;
}
