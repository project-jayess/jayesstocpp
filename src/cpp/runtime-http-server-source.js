export function getHttpServerRuntimeStateFragment() {
  return `struct http_server_state {
  int fd = -1;
  bool closed = false;
  std::mutex mutex;
};`;
}

export function getHttpServerRuntimePublicFragment() {
  return `bool is_http_server_value(const value& input) {
  return std::holds_alternative<http_server_ptr>(input);
}

value http_create_server(const value& handler, const value& optionsValue) {
#ifdef _WIN32
  (void)handler;
  (void)optionsValue;
  throw std::runtime_error("Jayess http is not available on this host");
#else
  if (!std::holds_alternative<callable_ptr>(handler)) {
    throw std::runtime_error("Jayess http createServer expects a handler function");
  }
  const auto options = parse_http_server_options(optionsValue);
  auto server = std::make_shared<http_server_state>();
  server->fd = http_listen_socket(options);
  std::thread([server, handler]() mutable {
    http_accept_loop(server, handler);
  }).detach();
  return server;
#endif
}

value http_close_server(const value& serverValue) {
#ifdef _WIN32
  (void)serverValue;
  throw std::runtime_error("Jayess http is not available on this host");
#else
  const auto server = require_http_server(serverValue);
  std::lock_guard<std::mutex> lock(server->mutex);
  if (server->closed) {
    throw_closed_handle("http", "server");
  }
  server->closed = true;
  http_close_fd(server->fd);
  return value(std::monostate{});
#endif
}`;
}
