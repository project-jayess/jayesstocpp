export function getHttpServerRuntimeStateFragment() {
  return `struct http_server_state {
  std::intptr_t fd = -1;
  bool closed = false;
  bool accept_loop_exited = false;
  std::size_t max_header_bytes = 0;
  std::size_t max_request_body_bytes = 0;
  std::size_t max_response_body_bytes = 0;
  int idle_timeout_milliseconds = 0;
  int header_timeout_milliseconds = 0;
  int body_timeout_milliseconds = 0;
  std::vector<std::intptr_t> active_client_fds;
  std::condition_variable shutdown_condition;
  std::mutex mutex;
};`;
}

export function getHttpServerRuntimePublicFragment() {
  return `bool is_http_server_value(const value& input) {
  return std::holds_alternative<http_server_ptr>(input);
}

value http_create_server(const value& handler, const value& optionsValue) {
  if (!std::holds_alternative<callable_ptr>(handler)) {
    throw std::runtime_error("Jayess http createServer expects a handler function");
  }
  const auto options = parse_http_server_options(optionsValue);
  if (options.tls_enabled) {
    throw_http_tls_unavailable();
  }
  auto server = std::make_shared<http_server_state>();
  server->fd = http_listen_socket(options);
  server->max_header_bytes = options.max_header_bytes;
  server->max_request_body_bytes = options.max_request_body_bytes;
  server->max_response_body_bytes = options.max_response_body_bytes;
  server->idle_timeout_milliseconds = options.idle_timeout_milliseconds;
  server->header_timeout_milliseconds = options.header_timeout_milliseconds;
  server->body_timeout_milliseconds = options.body_timeout_milliseconds;
  std::thread([server, handler]() mutable {
    http_accept_loop(server, handler);
  }).detach();
  return server;
}

value http_close_server(const value& serverValue) {
  const auto server = require_http_server(serverValue);
  std::unique_lock<std::mutex> lock(server->mutex);
  if (server->closed && server->fd < 0 && server->active_client_fds.empty() && server->accept_loop_exited) {
    throw_closed_handle("http", "server");
  }
  server->closed = true;
  http_close_fd(server->fd);
  const auto gracefulFinished = server->shutdown_condition.wait_for(lock, std::chrono::milliseconds(HTTP_SERVER_SHUTDOWN_GRACE_MILLISECONDS), [server]() {
    return server->active_client_fds.empty();
  });
  if (!gracefulFinished) {
    std::vector<std::intptr_t> remaining(server->active_client_fds.begin(), server->active_client_fds.end());
    lock.unlock();
    for (auto fd : remaining) {
      http_interrupt_fd(fd);
    }
    lock.lock();
    server->shutdown_condition.wait_for(lock, std::chrono::milliseconds(HTTP_SERVER_SHUTDOWN_GRACE_MILLISECONDS), [server]() {
      return server->active_client_fds.empty();
    });
  }
  server->shutdown_condition.wait_for(lock, std::chrono::milliseconds(HTTP_SERVER_SHUTDOWN_GRACE_MILLISECONDS), [server]() {
    return server->accept_loop_exited;
  });
  return value(std::monostate{});
}

value http_server_state_value(const value& serverValue) {
  const auto server = require_http_server(serverValue);
  std::lock_guard<std::mutex> lock(server->mutex);
  return make_object({
    {"closed", server->closed},
    {"acceptLoopExited", server->accept_loop_exited},
    {"activeClients", static_cast<double>(server->active_client_fds.size())}
  });
}`;
}
