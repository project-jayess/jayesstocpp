import { getNetRuntimeStateFragment } from "./runtime-net-state-source.js";
import { getNetPlatformRuntimeFragment } from "./runtime-net-platform-source.js";

export function getNetRuntimeHeaderFragment() {
  return `struct net_socket_state;
struct net_server_state;
value net_connect_async(const std::string& host, int port, const value& options);
value net_listen(const std::string& host, int port, const value& handler, const value& options);
value net_read_async(const value& socket);
value net_write_async(const value& socket, const value& data);
value net_local_address(const value& handle);
value net_local_port(const value& handle);
value net_remote_address(const value& socket);
value net_remote_port(const value& socket);
value net_close(const value& handle);
bool is_net_socket_value(const value& input);
bool is_net_server_value(const value& input);`;
}

export function getNetRuntimeCppFragment() {
  return `${getNetRuntimeStateFragment()}

namespace {
struct net_options {
  int timeout_milliseconds = -1;
  int backlog = 16;
  bool reuse_address = false;
};

net_socket_ptr require_net_socket(const value& input) {
  if (!std::holds_alternative<net_socket_ptr>(input)) {
    throw_invalid_handle("net", "socket");
  }
  return std::get<net_socket_ptr>(input);
}

net_server_ptr require_net_server(const value& input) {
  if (!std::holds_alternative<net_server_ptr>(input)) {
    throw_invalid_handle("net", "server");
  }
  return std::get<net_server_ptr>(input);
}

bytes_ptr require_net_bytes(const value& input) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error("Jayess net write expects bytes");
  }
  return std::get<bytes_ptr>(input);
}

int require_net_integer(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

bool require_net_bool(const value& input, const std::string& message) {
  if (!std::holds_alternative<bool>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bool>(input);
}

net_options parse_net_options(const value& input, bool serverOptions) {
  net_options options;
  if (std::holds_alternative<std::monostate>(input)) {
    return options;
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess net options must be an object");
  }
  for (const auto& [key, stored] : std::get<object_ptr>(input)->fields) {
    if (key == "timeoutMillis") {
      options.timeout_milliseconds = require_net_integer(stored, "Jayess net timeoutMillis option must be an integer");
      if (options.timeout_milliseconds < 0) {
        throw std::runtime_error("Jayess net timeoutMillis option must be non-negative");
      }
      continue;
    }
    if (serverOptions && key == "backlog") {
      options.backlog = require_net_integer(stored, "Jayess net backlog option must be an integer");
      if (options.backlog < 1) {
        throw std::runtime_error("Jayess net backlog option must be positive");
      }
      continue;
    }
    if (serverOptions && key == "reuseAddress") {
      options.reuse_address = require_net_bool(stored, "Jayess net reuseAddress option must be a boolean");
      continue;
    }
    throw_unsupported_option("net", key);
  }
  return options;
}

void validate_net_endpoint(const std::string& host, int port) {
  if (host.empty()) {
    throw std::runtime_error("Jayess net host must not be empty");
  }
  if (port < 0 || port > 65535) {
    throw std::runtime_error("Jayess net port must be between 0 and 65535");
  }
}

value net_async_result(std::function<value()> operation) {
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

${getNetPlatformRuntimeFragment()}
} // namespace

bool is_net_socket_value(const value& input) {
  return std::holds_alternative<net_socket_ptr>(input);
}

bool is_net_server_value(const value& input) {
  return std::holds_alternative<net_server_ptr>(input);
}

value net_connect_async(const std::string& host, int port, const value& options) {
  return net_async_result([host, port, options]() -> value {
    return net_connect_blocking(host, port, options);
  });
}

value net_listen(const std::string& host, int port, const value& handler, const value& optionsValue) {
  return net_listen_platform(host, port, handler, optionsValue);
}

value net_read_async(const value& input) {
  return net_async_result([input]() -> value {
    return net_read_platform(input);
  });
}

value net_write_async(const value& input, const value& data) {
  return net_async_result([input, data]() -> value {
    return net_write_platform(input, data);
  });
}

value net_local_address(const value& handle) {
  return net_local_address_platform(handle);
}

value net_local_port(const value& handle) {
  return net_local_port_platform(handle);
}

value net_remote_address(const value& input) {
  return net_remote_address_platform(input);
}

value net_remote_port(const value& input) {
  return net_remote_port_platform(input);
}

value net_close(const value& handle) {
  return net_close_platform(handle);
}`;
}
