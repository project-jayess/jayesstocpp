export function getFsRuntimeHeaderFragment() {
  return `value fs_exists_path(const std::string& pathText);
value fs_read_text_file(const std::string& pathText);
value fs_write_text_file(const std::string& pathText, const std::string& text);
value fs_create_directories(const std::string& pathText);
value fs_remove_path(const std::string& pathText);
value fs_list_directory(const std::string& pathText);
value fs_rename_path(const std::string& fromPathText, const std::string& toPathText);
value fs_stat_path(const std::string& pathText);`;
}

export function getFsRuntimeCppFragment() {
  return `namespace {
std::filesystem::path fs_require_path(const std::string& pathText) {
  return std::filesystem::path(pathText);
}

std::string fs_path_string_value(const std::filesystem::path& pathValue) {
  return pathValue.generic_string();
}

std::vector<value> fs_string_values(const std::vector<std::string>& entries) {
  std::vector<value> items;
  items.reserve(entries.size());
  for (const auto& entry : entries) {
    items.push_back(entry);
  }
  return items;
}
} // namespace

value fs_exists_path(const std::string& pathText) {
  return std::filesystem::exists(fs_require_path(pathText));
}

value fs_read_text_file(const std::string& pathText) {
  std::ifstream stream(fs_require_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to read file");
  }

  std::ostringstream content;
  content << stream.rdbuf();
  return content.str();
}

value fs_write_text_file(const std::string& pathText, const std::string& text) {
  std::ofstream stream(fs_require_path(pathText), std::ios::binary);
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
  return std::filesystem::create_directories(fs_require_path(pathText));
}

value fs_remove_path(const std::string& pathText) {
  return std::filesystem::remove(fs_require_path(pathText));
}

value fs_list_directory(const std::string& pathText) {
  std::vector<std::string> entryNames;
  for (const auto& entry : std::filesystem::directory_iterator(fs_require_path(pathText))) {
    entryNames.push_back(fs_path_string_value(entry.path().filename()));
  }
  std::sort(entryNames.begin(), entryNames.end());
  return make_array(fs_string_values(entryNames));
}

value fs_rename_path(const std::string& fromPathText, const std::string& toPathText) {
  std::filesystem::rename(
    fs_require_path(fromPathText),
    fs_require_path(toPathText)
  );
  return value(std::monostate{});
}

value fs_stat_path(const std::string& pathText) {
  std::error_code error;
  const auto pathValue = fs_require_path(pathText);
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
}`;
}
