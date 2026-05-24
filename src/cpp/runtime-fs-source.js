export function getFsRuntimeHeaderFragment() {
  return `value fs_exists_path(const std::string& pathText);
value fs_read_text_file(const std::string& pathText);
value fs_read_bytes_file(const std::string& pathText);
value fs_write_text_file(const std::string& pathText, const std::string& text);
value fs_write_bytes_file(const std::string& pathText, const value& bytes);
value fs_append_text_file(const std::string& pathText, const std::string& text);
value fs_copy_path(const std::string& fromPathText, const std::string& toPathText);
value fs_copy_path_recursive(const std::string& fromPathText, const std::string& toPathText);
value fs_create_directories(const std::string& pathText);
value fs_remove_path(const std::string& pathText);
value fs_remove_path_recursive(const std::string& pathText);
value fs_list_directory(const std::string& pathText);
value fs_walk_directory(const std::string& pathText);
value fs_rename_path(const std::string& fromPathText, const std::string& toPathText);
value fs_stat_path(const std::string& pathText);
value fs_exists_path_async(const std::string& pathText);
value fs_read_text_file_async(const std::string& pathText);
value fs_read_bytes_file_async(const std::string& pathText);
value fs_write_text_file_async(const std::string& pathText, const std::string& text);
value fs_write_bytes_file_async(const std::string& pathText, const value& bytes);
value fs_append_text_file_async(const std::string& pathText, const std::string& text);
value fs_copy_path_async(const std::string& fromPathText, const std::string& toPathText);
value fs_copy_path_recursive_async(const std::string& fromPathText, const std::string& toPathText);
value fs_create_directories_async(const std::string& pathText);
value fs_remove_path_async(const std::string& pathText);
value fs_remove_path_recursive_async(const std::string& pathText);
value fs_list_directory_async(const std::string& pathText);
value fs_walk_directory_async(const std::string& pathText);
value fs_rename_path_async(const std::string& fromPathText, const std::string& toPathText);
value fs_stat_path_async(const std::string& pathText);`;
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

value fs_async_result(std::function<value()> operation) {
  const auto result = make_pending_async();
  async_schedule([result, operation = std::move(operation)]() mutable {
    try {
      async_resolve(result, operation());
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
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

value fs_read_bytes_file(const std::string& pathText) {
  std::ifstream stream(fs_require_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to read file");
  }

  std::vector<unsigned char> items;
  char current;
  while (stream.get(current)) {
    items.push_back(static_cast<unsigned char>(current));
  }
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
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

value fs_write_bytes_file(const std::string& pathText, const value& bytesValue) {
  if (!std::holds_alternative<bytes_ptr>(bytesValue)) {
    throw std::runtime_error("Jayess fs writeBytes expects bytes content");
  }

  std::ofstream stream(fs_require_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to write file");
  }

  const auto bytes = std::get<bytes_ptr>(bytesValue);
  stream.write(reinterpret_cast<const char*>(bytes->items.data()), static_cast<std::streamsize>(bytes->items.size()));
  if (!stream) {
    throw std::runtime_error("Unable to write file");
  }

  return value(std::monostate{});
}

value fs_append_text_file(const std::string& pathText, const std::string& text) {
  std::ofstream stream(fs_require_path(pathText), std::ios::binary | std::ios::app);
  if (!stream) {
    throw std::runtime_error("Unable to append file");
  }

  stream << text;
  if (!stream) {
    throw std::runtime_error("Unable to append file");
  }

  return value(std::monostate{});
}

value fs_copy_path(const std::string& fromPathText, const std::string& toPathText) {
  std::filesystem::copy_file(
    fs_require_path(fromPathText),
    fs_require_path(toPathText),
    std::filesystem::copy_options::overwrite_existing
  );
  return value(std::monostate{});
}

value fs_copy_path_recursive(const std::string& fromPathText, const std::string& toPathText) {
  std::filesystem::copy(
    fs_require_path(fromPathText),
    fs_require_path(toPathText),
    std::filesystem::copy_options::recursive | std::filesystem::copy_options::overwrite_existing
  );
  return value(std::monostate{});
}

value fs_create_directories(const std::string& pathText) {
  return std::filesystem::create_directories(fs_require_path(pathText));
}

value fs_remove_path(const std::string& pathText) {
  return std::filesystem::remove(fs_require_path(pathText));
}

value fs_remove_path_recursive(const std::string& pathText) {
  return static_cast<double>(std::filesystem::remove_all(fs_require_path(pathText)));
}

value fs_list_directory(const std::string& pathText) {
  std::vector<std::string> entryNames;
  for (const auto& entry : std::filesystem::directory_iterator(fs_require_path(pathText))) {
    entryNames.push_back(fs_path_string_value(entry.path().filename()));
  }
  std::sort(entryNames.begin(), entryNames.end());
  return make_array(fs_string_values(entryNames));
}

value fs_walk_directory(const std::string& pathText) {
  const auto root = fs_require_path(pathText);
  std::vector<std::string> entryNames;
  for (const auto& entry : std::filesystem::recursive_directory_iterator(root)) {
    entryNames.push_back(fs_path_string_value(std::filesystem::relative(entry.path(), root)));
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
}

value fs_exists_path_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_exists_path(pathText); });
}

value fs_read_text_file_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_read_text_file(pathText); });
}

value fs_read_bytes_file_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_read_bytes_file(pathText); });
}

value fs_write_text_file_async(const std::string& pathText, const std::string& text) {
  return fs_async_result([pathText, text]() { return fs_write_text_file(pathText, text); });
}

value fs_write_bytes_file_async(const std::string& pathText, const value& bytes) {
  return fs_async_result([pathText, bytes]() { return fs_write_bytes_file(pathText, bytes); });
}

value fs_append_text_file_async(const std::string& pathText, const std::string& text) {
  return fs_async_result([pathText, text]() { return fs_append_text_file(pathText, text); });
}

value fs_copy_path_async(const std::string& fromPathText, const std::string& toPathText) {
  return fs_async_result([fromPathText, toPathText]() { return fs_copy_path(fromPathText, toPathText); });
}

value fs_copy_path_recursive_async(const std::string& fromPathText, const std::string& toPathText) {
  return fs_async_result([fromPathText, toPathText]() { return fs_copy_path_recursive(fromPathText, toPathText); });
}

value fs_create_directories_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_create_directories(pathText); });
}

value fs_remove_path_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_remove_path(pathText); });
}

value fs_remove_path_recursive_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_remove_path_recursive(pathText); });
}

value fs_list_directory_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_list_directory(pathText); });
}

value fs_walk_directory_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_walk_directory(pathText); });
}

value fs_rename_path_async(const std::string& fromPathText, const std::string& toPathText) {
  return fs_async_result([fromPathText, toPathText]() { return fs_rename_path(fromPathText, toPathText); });
}

value fs_stat_path_async(const std::string& pathText) {
  return fs_async_result([pathText]() { return fs_stat_path(pathText); });
}`;
}
