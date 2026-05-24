export function getSystemRuntimeHeaderFragment() {
  return `value process_current_working_directory();
value process_get_env(const std::string& key);
value process_has_env(const std::string& key);
value process_env_keys();
value process_env_entries();
void process_set_argv(std::vector<std::string> args);
value process_get_argv();
value process_set_exit_code(int code);
[[noreturn]] void process_exit_with_code(int code);`;
}

export function getSystemRuntimeCppFragment() {
  return `namespace {
std::vector<value> process_string_values(const std::vector<std::string>& entries) {
  std::vector<value> items;
  items.reserve(entries.size());
  for (const auto& entry : entries) {
    items.push_back(entry);
  }
  return items;
}

std::vector<std::string> process_argv_storage;
int process_exit_code_storage = 0;

#ifndef _WIN32
extern char** environ;

std::vector<std::pair<std::string, std::string>> process_environment_pairs() {
  std::vector<std::pair<std::string, std::string>> pairs;
  if (environ == nullptr) {
    return pairs;
  }
  for (char** current = environ; *current != nullptr; current += 1) {
    const std::string entry(*current);
    const auto equals = entry.find('=');
    if (equals == std::string::npos) {
      pairs.push_back({entry, ""});
      continue;
    }
    pairs.push_back({entry.substr(0, equals), entry.substr(equals + 1)});
  }
  return pairs;
}
#else
std::vector<std::pair<std::string, std::string>> process_environment_pairs() {
  return {};
}
#endif
} // namespace

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

value process_has_env(const std::string& key) {
  return std::getenv(key.c_str()) != nullptr;
}

value process_env_keys() {
  std::vector<value> keys;
  for (const auto& [key, envValue] : process_environment_pairs()) {
    (void)envValue;
    keys.push_back(key);
  }
  return make_array(std::move(keys));
}

value process_env_entries() {
  std::vector<value> entries;
  for (const auto& [key, envValue] : process_environment_pairs()) {
    entries.push_back(make_object({
      {"key", key},
      {"value", envValue}
    }));
  }
  return make_array(std::move(entries));
}

void process_set_argv(std::vector<std::string> args) {
  process_argv_storage = std::move(args);
}

value process_get_argv() {
  return make_array(process_string_values(process_argv_storage));
}

value process_set_exit_code(int code) {
  process_exit_code_storage = code;
  return static_cast<double>(process_exit_code_storage);
}

void process_exit_with_code(int code) {
  std::exit(code);
}`;
}
