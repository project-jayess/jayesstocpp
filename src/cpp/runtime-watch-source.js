import { getWatchLinuxAdapterCppFragment } from "./runtime-watch-linux-source.js";
import { getWatchMacosAdapterCppFragment } from "./runtime-watch-macos-source.js";
import { getWatchWindowsAdapterCppFragment } from "./runtime-watch-windows-source.js";

export function getWatchRuntimeHeaderFragment() {
  return `struct watch_state {
  std::string path;
  bool closed = false;
  std::unordered_map<std::string, long long> entries;
  std::mutex mutex;
};

value watch_create(const value& path, const value& options);
value watch_poll(const value& watcher);
value watch_close(const value& watcher);
bool is_watch_value(const value& input);`;
}

export function getWatchRuntimeCppFragment() {
  return `namespace {
${getWatchLinuxAdapterCppFragment()}
${getWatchMacosAdapterCppFragment()}
${getWatchWindowsAdapterCppFragment()}

#if !defined(__linux__) && !defined(__APPLE__) && !defined(_WIN32)
std::string watch_platform_name() {
  return "portable";
}
#endif

std::string require_watch_path(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess watch path must be a string");
  }
  return std::get<std::string>(input);
}

watch_ptr require_watch_value(const value& input) {
  if (!std::holds_alternative<watch_ptr>(input)) {
    throw_invalid_handle("watch", "watcher");
  }
  return std::get<watch_ptr>(input);
}

long long watch_mtime(const std::filesystem::path& pathValue) {
  std::error_code error;
  const auto time = std::filesystem::last_write_time(pathValue, error);
  if (error) {
    return 0;
  }
  return time.time_since_epoch().count();
}

void watch_collect(const std::filesystem::path& root, std::unordered_map<std::string, long long>& entries) {
  std::error_code error;
  if (!std::filesystem::exists(root, error)) {
    return;
  }
  entries[root.generic_string()] = watch_mtime(root);
  if (!std::filesystem::is_directory(root, error)) {
    return;
  }
  for (const auto& entry : std::filesystem::directory_iterator(root, error)) {
    if (error) {
      return;
    }
    entries[entry.path().generic_string()] = watch_mtime(entry.path());
  }
}

std::unordered_map<std::string, long long> watch_snapshot(const std::string& pathText) {
  std::unordered_map<std::string, long long> entries;
  watch_collect(std::filesystem::path(pathText), entries);
  return entries;
}

value watch_event(const std::string& type, const std::string& pathText) {
  return make_object({
    {"type", type},
    {"path", pathText}
  });
}
} // namespace

bool is_watch_value(const value& input) {
  return std::holds_alternative<watch_ptr>(input);
}

value watch_create(const value& pathValue, const value& optionsValue) {
  const auto pathText = require_watch_path(pathValue);
  if (!std::holds_alternative<std::monostate>(optionsValue) && !std::holds_alternative<object_ptr>(optionsValue)) {
    throw std::runtime_error("Jayess watch options must be an object or null");
  }
  auto watcher = std::make_shared<watch_state>();
  watcher->path = pathText;
  watcher->entries = watch_snapshot(pathText);
  (void)watch_platform_name();
  return watcher;
}

value watch_poll(const value& watcherValue) {
  const auto watcher = require_watch_value(watcherValue);
  std::lock_guard<std::mutex> lock(watcher->mutex);
  if (watcher->closed) {
    throw_closed_handle("watch", "watcher");
  }
  const auto current = watch_snapshot(watcher->path);
  std::vector<value> events;
  std::vector<std::string> paths;
  for (const auto& [pathText, previousTime] : watcher->entries) {
    (void)previousTime;
    paths.push_back(pathText);
  }
  for (const auto& [pathText, currentTime] : current) {
    (void)currentTime;
    paths.push_back(pathText);
  }
  std::sort(paths.begin(), paths.end());
  paths.erase(std::unique(paths.begin(), paths.end()), paths.end());
  for (const auto& pathText : paths) {
    const auto previous = watcher->entries.find(pathText);
    const auto next = current.find(pathText);
    if (previous == watcher->entries.end() && next != current.end()) {
      events.push_back(watch_event("create", pathText));
    } else if (previous != watcher->entries.end() && next == current.end()) {
      events.push_back(watch_event("remove", pathText));
    } else if (previous != watcher->entries.end() && next != current.end() && previous->second != next->second) {
      events.push_back(watch_event("modify", pathText));
    }
  }
  watcher->entries = current;
  return make_array(std::move(events));
}

value watch_close(const value& watcherValue) {
  const auto watcher = require_watch_value(watcherValue);
  std::lock_guard<std::mutex> lock(watcher->mutex);
  if (watcher->closed) {
    throw_closed_handle("watch", "watcher");
  }
  watcher->closed = true;
  return value(std::monostate{});
}`;
}
