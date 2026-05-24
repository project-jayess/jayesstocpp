export function getSubprocessRuntimeHeaderFragment() {
  return `struct subprocess_state;
value subprocess_run_async(const std::string& command, const value& args, const value& options);
value subprocess_spawn(const std::string& command, const value& args, const value& options);
value subprocess_join(const value& input);
value subprocess_kill(const value& input);
value subprocess_stdout_stream(const value& input);
value subprocess_stderr_stream(const value& input);
bool is_subprocess_value(const value& input);`;
}

export function getSubprocessRuntimeCppFragment() {
  return `struct subprocess_state {
  long pid = -1;
  std::filesystem::path stdout_path;
  std::filesystem::path stderr_path;
  std::filesystem::path stdin_path;
  bool has_stdin_path = false;
  bool stdout_streamed = false;
  bool stderr_streamed = false;
  bool joined = false;
  bool killed = false;
  bool timed_out = false;
  int timeout_milliseconds = -1;
};

namespace {
struct subprocess_options {
  bool has_cwd = false;
  std::string cwd;
  std::vector<std::pair<std::string, std::string>> env;
  bool has_stdin = false;
  std::vector<unsigned char> stdin_bytes;
  int timeout_milliseconds = -1;
};

std::atomic<unsigned long> subprocess_temp_counter{0};

subprocess_ptr require_subprocess_handle(const value& input) {
  if (!std::holds_alternative<subprocess_ptr>(input)) {
    throw_invalid_handle("subprocess", "subprocess");
  }
  return std::get<subprocess_ptr>(input);
}

std::string require_subprocess_string(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

int require_subprocess_integer(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

std::vector<std::string> subprocess_argument_list(const value& argsValue) {
  if (!std::holds_alternative<array_ptr>(argsValue)) {
    throw std::runtime_error("Jayess subprocess expects args to be an array");
  }

  std::vector<std::string> args;
  for (const auto& item : std::get<array_ptr>(argsValue)->items) {
    args.push_back(require_subprocess_string(item, "Jayess subprocess args must contain only strings"));
  }
  return args;
}

void reject_unknown_subprocess_option(const std::string& key) {
  throw_unsupported_option("subprocess", key);
}

subprocess_options subprocess_parse_options(const value& optionsValue) {
  subprocess_options options;
  if (std::holds_alternative<std::monostate>(optionsValue)) {
    return options;
  }
  if (!std::holds_alternative<object_ptr>(optionsValue)) {
    throw std::runtime_error("Jayess subprocess options must be an object");
  }

  const auto object = std::get<object_ptr>(optionsValue);
  for (const auto& [key, stored] : object->fields) {
    if (key == "cwd") {
      options.has_cwd = true;
      options.cwd = require_subprocess_string(stored, "Jayess subprocess cwd option must be a string");
      continue;
    }
    if (key == "stdin") {
      options.has_stdin = true;
      const auto text = require_subprocess_string(stored, "Jayess subprocess stdin option must be a string");
      options.stdin_bytes.assign(text.begin(), text.end());
      continue;
    }
    if (key == "stdinBytes") {
      if (!std::holds_alternative<bytes_ptr>(stored)) {
        throw std::runtime_error("Jayess subprocess stdinBytes option must be bytes");
      }
      options.has_stdin = true;
      options.stdin_bytes = std::get<bytes_ptr>(stored)->items;
      continue;
    }
    if (key == "timeoutMillis") {
      options.timeout_milliseconds = require_subprocess_integer(stored, "Jayess subprocess timeoutMillis option must be an integer");
      if (options.timeout_milliseconds < 0) {
        throw std::runtime_error("Jayess subprocess timeoutMillis option must be non-negative");
      }
      continue;
    }
    if (key == "env") {
      if (!std::holds_alternative<object_ptr>(stored)) {
        throw std::runtime_error("Jayess subprocess env option must be an object");
      }
      for (const auto& [envKey, envValue] : std::get<object_ptr>(stored)->fields) {
        options.env.push_back({
          envKey,
          require_subprocess_string(envValue, "Jayess subprocess env values must be strings")
        });
      }
      continue;
    }
    reject_unknown_subprocess_option(key);
  }
  return options;
}

std::filesystem::path subprocess_temp_path(const std::string& label) {
  const auto index = subprocess_temp_counter.fetch_add(1);
  return std::filesystem::temp_directory_path() / ("jayess_subprocess_" + std::to_string(index) + "_" + label);
}

std::string subprocess_read_file(const std::filesystem::path& pathValue) {
  std::ifstream stream(pathValue, std::ios::binary);
  if (!stream) {
    return "";
  }
  std::ostringstream content;
  content << stream.rdbuf();
  return content.str();
}

void subprocess_remove_file(const std::filesystem::path& pathValue) {
  std::error_code error;
  std::filesystem::remove(pathValue, error);
}

value subprocess_completion_object(const subprocess_ptr& state, int exitCode) {
  const auto stdoutText = subprocess_read_file(state->stdout_path);
  const auto stderrText = subprocess_read_file(state->stderr_path);
  if (!state->stdout_streamed) {
    subprocess_remove_file(state->stdout_path);
  }
  if (!state->stderr_streamed) {
    subprocess_remove_file(state->stderr_path);
  }
  if (state->has_stdin_path) {
    subprocess_remove_file(state->stdin_path);
  }
  return make_object({
    {"stdout", stdoutText},
    {"stderr", stderrText},
    {"exitCode", static_cast<double>(exitCode)},
    {"killed", state->killed},
    {"timedOut", state->timed_out}
  });
}

#ifndef _WIN32
int subprocess_wait(const subprocess_ptr& state) {
  int status = 0;
  const auto started = std::chrono::steady_clock::now();
  for (;;) {
    const auto result = ::waitpid(static_cast<pid_t>(state->pid), &status, WNOHANG);
    if (result == static_cast<pid_t>(state->pid)) {
      break;
    }
    if (result == -1) {
      throw std::runtime_error("Unable to wait for Jayess subprocess");
    }
    if (state->timeout_milliseconds >= 0) {
      const auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now() - started
      ).count();
      if (elapsed > state->timeout_milliseconds) {
        ::kill(static_cast<pid_t>(state->pid), SIGTERM);
        state->killed = true;
        state->timed_out = true;
      }
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
  }

  if (WIFEXITED(status)) {
    return WEXITSTATUS(status);
  }
  if (WIFSIGNALED(status)) {
    return 128 + WTERMSIG(status);
  }
  return 1;
}

void subprocess_write_stdin_file(const std::filesystem::path& pathValue, const std::vector<unsigned char>& bytes) {
  std::ofstream stream(pathValue, std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to write Jayess subprocess stdin");
  }
  if (!bytes.empty()) {
    stream.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
  }
}

void subprocess_touch_output_file(const std::filesystem::path& pathValue) {
  std::ofstream stream(pathValue, std::ios::binary | std::ios::trunc);
  if (!stream) {
    throw std::runtime_error("Unable to create Jayess subprocess output file");
  }
}

subprocess_ptr subprocess_start_process(const std::string& command, const value& argsValue, const value& optionsValue) {
  const auto args = subprocess_argument_list(argsValue);
  const auto options = subprocess_parse_options(optionsValue);
  auto state = std::make_shared<subprocess_state>();
  state->stdout_path = subprocess_temp_path("stdout.txt");
  state->stderr_path = subprocess_temp_path("stderr.txt");
  state->timeout_milliseconds = options.timeout_milliseconds;
  subprocess_touch_output_file(state->stdout_path);
  subprocess_touch_output_file(state->stderr_path);

  if (options.has_stdin) {
    state->stdin_path = subprocess_temp_path("stdin.txt");
    state->has_stdin_path = true;
    subprocess_write_stdin_file(state->stdin_path, options.stdin_bytes);
  }

  const auto pid = ::fork();
  if (pid < 0) {
    throw std::runtime_error("Unable to start Jayess subprocess");
  }

  if (pid == 0) {
    if (options.has_cwd) {
      ::chdir(options.cwd.c_str());
    }
    for (const auto& [key, envValue] : options.env) {
      ::setenv(key.c_str(), envValue.c_str(), 1);
    }

    const auto stdoutFd = ::open(state->stdout_path.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0600);
    const auto stderrFd = ::open(state->stderr_path.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0600);
    if (stdoutFd >= 0) {
      ::dup2(stdoutFd, STDOUT_FILENO);
      ::close(stdoutFd);
    }
    if (stderrFd >= 0) {
      ::dup2(stderrFd, STDERR_FILENO);
      ::close(stderrFd);
    }
    if (state->has_stdin_path) {
      const auto stdinFd = ::open(state->stdin_path.c_str(), O_RDONLY);
      if (stdinFd >= 0) {
        ::dup2(stdinFd, STDIN_FILENO);
        ::close(stdinFd);
      }
    }

    std::vector<std::string> argvStorage;
    argvStorage.reserve(args.size() + 1);
    argvStorage.push_back(command);
    for (const auto& arg : args) {
      argvStorage.push_back(arg);
    }

    std::vector<char*> argv;
    argv.reserve(argvStorage.size() + 1);
    for (auto& arg : argvStorage) {
      argv.push_back(arg.data());
    }
    argv.push_back(nullptr);

    ::execvp(command.c_str(), argv.data());
    std::cerr << "Unable to execute Jayess subprocess command: " << command << std::endl;
    ::_exit(127);
  }

  state->pid = static_cast<long>(pid);
  return state;
}
#else
subprocess_ptr subprocess_start_process(const std::string&, const value&, const value&) {
  throw std::runtime_error("Jayess subprocess is not available on this host");
}

int subprocess_wait(const subprocess_ptr&) {
  throw std::runtime_error("Jayess subprocess is not available on this host");
}
#endif

value subprocess_output_stream(const value& input, bool stderrStream) {
  const auto state = require_subprocess_handle(input);
  if (state->joined) {
    throw_completed_handle("subprocess", "subprocess", "joined");
  }
  if (stderrStream) {
    state->stderr_streamed = true;
    return stream_open_read_async(state->stderr_path.string());
  }
  state->stdout_streamed = true;
  return stream_open_read_async(state->stdout_path.string());
}

value subprocess_join_state(const subprocess_ptr& state) {
  if (state->joined) {
    throw_completed_handle("subprocess", "subprocess", "joined");
  }
  const auto exitCode = subprocess_wait(state);
  state->joined = true;
  return subprocess_completion_object(state, exitCode);
}
} // namespace

bool is_subprocess_value(const value& input) {
  return std::holds_alternative<subprocess_ptr>(input);
}

value subprocess_spawn(const std::string& command, const value& args, const value& options) {
  return subprocess_start_process(command, args, options);
}

value subprocess_join(const value& input) {
  return subprocess_join_state(require_subprocess_handle(input));
}

value subprocess_kill(const value& input) {
  const auto state = require_subprocess_handle(input);
  if (state->joined) {
    throw_completed_handle("subprocess", "subprocess", "joined");
  }
#ifndef _WIN32
  if (state->pid >= 0) {
    ::kill(static_cast<pid_t>(state->pid), SIGTERM);
    state->killed = true;
  }
#endif
  return value(std::monostate{});
}

value subprocess_stdout_stream(const value& input) {
  return subprocess_output_stream(input, false);
}

value subprocess_stderr_stream(const value& input) {
  return subprocess_output_stream(input, true);
}

value subprocess_run_async(const std::string& command, const value& args, const value& options) {
  const auto result = make_pending_async();
  async_schedule([result, command, args, options]() mutable {
    try {
      async_resolve(result, subprocess_join_state(subprocess_start_process(command, args, options)));
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
}`;
}
