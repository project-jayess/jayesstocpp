export function getSystemRuntimeHeaderFragment() {
  return `value fs_exists_path(const std::string& pathText);
value fs_read_text_file(const std::string& pathText);
value fs_write_text_file(const std::string& pathText, const std::string& text);
value fs_create_directories(const std::string& pathText);
value fs_remove_path(const std::string& pathText);
value fs_list_directory(const std::string& pathText);
value fs_rename_path(const std::string& fromPathText, const std::string& toPathText);
value fs_stat_path(const std::string& pathText);
value path_join_parts(const std::vector<std::string>& parts);
value path_dirname(const std::string& pathText);
value path_basename(const std::string& pathText);
value path_extname(const std::string& pathText);
value path_normalize(const std::string& pathText);
value path_resolve_parts(const std::vector<std::string>& parts);
value path_relative_between(const std::string& fromPathText, const std::string& toPathText);
value path_is_absolute(const std::string& pathText);
value process_current_working_directory();
value process_get_env(const std::string& key);
void process_set_argv(std::vector<std::string> args);
value process_get_argv();
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

std::vector<value> string_values(const std::vector<std::string>& entries) {
  std::vector<value> items;
  items.reserve(entries.size());
  for (const auto& entry : entries) {
    items.push_back(entry);
  }
  return items;
}

std::vector<std::string> process_argv_storage;
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

value fs_remove_path(const std::string& pathText) {
  return std::filesystem::remove(require_filesystem_path(pathText));
}

value fs_list_directory(const std::string& pathText) {
  std::vector<std::string> entryNames;
  for (const auto& entry : std::filesystem::directory_iterator(require_filesystem_path(pathText))) {
    entryNames.push_back(path_string_value(entry.path().filename()));
  }
  std::sort(entryNames.begin(), entryNames.end());
  return make_array(string_values(entryNames));
}

value fs_rename_path(const std::string& fromPathText, const std::string& toPathText) {
  std::filesystem::rename(
    require_filesystem_path(fromPathText),
    require_filesystem_path(toPathText)
  );
  return value(std::monostate{});
}

value fs_stat_path(const std::string& pathText) {
  std::error_code error;
  const auto pathValue = require_filesystem_path(pathText);
  const auto exists = std::filesystem::exists(pathValue, error);
  if (error) {
    throw std::runtime_error("Unable to stat path");
  }

  const auto isFile = exists && std::filesystem::is_regular_file(pathValue, error);
  if (error) {
    throw std::runtime_error("Unable to stat path");
  }

  const auto isDirectory = exists && std::filesystem::is_directory(pathValue, error);
  if (error) {
    throw std::runtime_error("Unable to stat path");
  }

  value sizeValue = value(std::monostate{});
  if (isFile) {
    const auto fileSize = std::filesystem::file_size(pathValue, error);
    if (error) {
      throw std::runtime_error("Unable to stat path");
    }
    sizeValue = static_cast<double>(fileSize);
  }

  return make_object({
    {"exists", exists},
    {"isFile", isFile},
    {"isDirectory", isDirectory},
    {"size", sizeValue}
  });
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
      require_filesystem_path(toPathText),
      require_filesystem_path(fromPathText)
    ).lexically_normal()
  );
}

value path_is_absolute(const std::string& pathText) {
  return require_filesystem_path(pathText).is_absolute();
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

void process_set_argv(std::vector<std::string> args) {
  process_argv_storage = std::move(args);
}

value process_get_argv() {
  return make_array(string_values(process_argv_storage));
}

void process_exit_with_code(int code) {
  std::exit(code);
}`;
}
