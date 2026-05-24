export function getOsRuntimeHeaderFragment() {
  return `value os_platform();
value os_arch();
value os_home_directory();
value os_temporary_directory();
value os_hostname();
value os_newline();`;
}

export function getOsRuntimeCppFragment() {
  return `namespace {
value os_environment_string(const char* key) {
  const auto* envValue = std::getenv(key);
  if (envValue == nullptr || std::string(envValue).empty()) {
    return value(std::monostate{});
  }
  return std::string(envValue);
}

std::string os_filesystem_string(const std::filesystem::path& pathValue) {
  return pathValue.generic_string();
}
} // namespace

value os_platform() {
#if defined(_WIN32)
  return std::string("windows");
#elif defined(__APPLE__)
  return std::string("darwin");
#elif defined(__linux__)
  return std::string("linux");
#elif defined(__FreeBSD__)
  return std::string("freebsd");
#elif defined(__unix__)
  return std::string("unix");
#else
  return std::string("unknown");
#endif
}

value os_arch() {
#if defined(__x86_64__) || defined(_M_X64)
  return std::string("x64");
#elif defined(__i386__) || defined(_M_IX86)
  return std::string("x86");
#elif defined(__aarch64__) || defined(_M_ARM64)
  return std::string("arm64");
#elif defined(__arm__) || defined(_M_ARM)
  return std::string("arm");
#else
  return std::string("unknown");
#endif
}

value os_home_directory() {
#if defined(_WIN32)
  auto home = os_environment_string("USERPROFILE");
  if (!is_null(home)) {
    return home;
  }
  auto drive = os_environment_string("HOMEDRIVE");
  auto path = os_environment_string("HOMEPATH");
  if (std::holds_alternative<std::string>(drive) && std::holds_alternative<std::string>(path)) {
    return std::get<std::string>(drive) + std::get<std::string>(path);
  }
  return value(std::monostate{});
#else
  return os_environment_string("HOME");
#endif
}

value os_temporary_directory() {
  return os_filesystem_string(std::filesystem::temp_directory_path());
}

value os_hostname() {
  auto hostname = os_environment_string("HOSTNAME");
  if (!is_null(hostname)) {
    return hostname;
  }
  hostname = os_environment_string("COMPUTERNAME");
  if (!is_null(hostname)) {
    return hostname;
  }
  return value(std::monostate{});
}

value os_newline() {
#if defined(_WIN32)
  return std::string("\\r\\n");
#else
  return std::string("\\n");
#endif
}`;
}
