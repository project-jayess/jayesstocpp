export function getNetWindowsPlatformRuntimeFragment() {
  return `#ifdef _WIN32
SOCKET net_socket_from_handle(net_handle_t handle) {
  return static_cast<SOCKET>(handle);
}

net_handle_t net_handle_from_socket(SOCKET socket) {
  return static_cast<net_handle_t>(socket);
}

void close_fd_if_open(net_handle_t& fd) {
  if (fd != -1) {
    ::closesocket(net_socket_from_handle(fd));
    fd = -1;
  }
}

void ensure_winsock_ready() {
  static std::once_flag once;
  static int startupStatus = 0;
  std::call_once(once, []() {
    WSADATA data{};
    startupStatus = ::WSAStartup(MAKEWORD(2, 2), &data);
  });
  if (startupStatus != 0) {
    throw std::runtime_error("Unable to initialize Jayess net host adapter");
  }
}

std::runtime_error net_socket_error(const std::string& action) {
  return std::runtime_error(action + " for Jayess net socket");
}

addrinfo* resolve_net_address(const std::string& host, int port, int family, int socktype, int flags) {
  ensure_winsock_ready();
  addrinfo hints{};
  hints.ai_family = family;
  hints.ai_socktype = socktype;
  hints.ai_flags = flags;

  addrinfo* result = nullptr;
  const auto service = std::to_string(port);
  const auto status = ::getaddrinfo(host.c_str(), service.c_str(), &hints, &result);
  if (status != 0 || result == nullptr) {
    throw std::runtime_error("Unable to resolve Jayess net host");
  }
  return result;
}

std::pair<std::string, int> net_endpoint_for_fd(net_handle_t fd, bool local) {
  sockaddr_storage storage{};
  int length = sizeof(storage);
  const auto socket = net_socket_from_handle(fd);
  const auto status = local
    ? ::getsockname(socket, reinterpret_cast<sockaddr*>(&storage), &length)
    : ::getpeername(socket, reinterpret_cast<sockaddr*>(&storage), &length);
  if (status != 0) {
    return {"", 0};
  }

  char host[NI_MAXHOST];
  char service[NI_MAXSERV];
  if (::getnameinfo(
    reinterpret_cast<sockaddr*>(&storage),
    length,
    host,
    sizeof(host),
    service,
    sizeof(service),
    NI_NUMERICHOST | NI_NUMERICSERV
  ) != 0) {
    return {"", 0};
  }
  return {host, std::stoi(service)};
}

net_socket_ptr make_net_socket(net_handle_t fd) {
  auto socket = std::make_shared<net_socket_state>();
  socket->fd = fd;
  const auto local = net_endpoint_for_fd(fd, true);
  const auto remote = net_endpoint_for_fd(fd, false);
  socket->local_address = local.first;
  socket->local_port = local.second;
  socket->remote_address = remote.first;
  socket->remote_port = remote.second;
  return socket;
}

void require_open_socket(const net_socket_ptr& socket) {
  if (socket->closed || socket->fd == -1) {
    throw_closed_handle("net", "socket");
  }
}

void require_open_server(const net_server_ptr& server) {
  if (server->closed || server->fd == -1) {
    throw_closed_handle("net", "server");
  }
}

bool wait_for_windows_connect(SOCKET socket, int timeoutMilliseconds) {
  fd_set writeSet;
  FD_ZERO(&writeSet);
  FD_SET(socket, &writeSet);
  timeval timeout{};
  timeout.tv_sec = timeoutMilliseconds / 1000;
  timeout.tv_usec = (timeoutMilliseconds % 1000) * 1000;
  const auto selected = ::select(0, nullptr, &writeSet, nullptr, &timeout);
  if (selected == 0) {
    throw_timeout_elapsed("net");
  }
  if (selected <= 0 || !FD_ISSET(socket, &writeSet)) {
    return false;
  }
  int socketError = 0;
  int socketErrorLength = sizeof(socketError);
  return ::getsockopt(socket, SOL_SOCKET, SO_ERROR, reinterpret_cast<char*>(&socketError), &socketErrorLength) == 0
    && socketError == 0;
}

value net_connect_blocking(const std::string& host, int port, const value& optionsValue) {
  validate_net_endpoint(host, port);
  const auto options = parse_net_options(optionsValue, false);

  addrinfo* addresses = resolve_net_address(host, port, AF_UNSPEC, SOCK_STREAM, 0);
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);

  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket == INVALID_SOCKET) {
      continue;
    }
    bool connected = false;
    if (options.timeout_milliseconds >= 0) {
      u_long nonBlocking = 1;
      ::ioctlsocket(socket, FIONBIO, &nonBlocking);
      const auto status = ::connect(socket, current->ai_addr, static_cast<int>(current->ai_addrlen));
      if (status == 0) {
        connected = true;
      } else {
        const auto error = ::WSAGetLastError();
        if (error == WSAEWOULDBLOCK || error == WSAEINPROGRESS || error == WSAEINVAL) {
          connected = wait_for_windows_connect(socket, options.timeout_milliseconds);
        }
      }
      nonBlocking = 0;
      ::ioctlsocket(socket, FIONBIO, &nonBlocking);
    } else if (::connect(socket, current->ai_addr, static_cast<int>(current->ai_addrlen)) == 0) {
      connected = true;
    }
    if (connected) {
      return make_net_socket(net_handle_from_socket(socket));
    }
    auto ownedFd = net_handle_from_socket(socket);
    close_fd_if_open(ownedFd);
  }
  throw std::runtime_error("Unable to connect Jayess net socket");
}

net_handle_t open_server_socket(const std::string& host, int port, const net_options& options) {
  validate_net_endpoint(host, port);
  addrinfo* addresses = resolve_net_address(host, port, AF_UNSPEC, SOCK_STREAM, AI_PASSIVE);
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);

  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket == INVALID_SOCKET) {
      continue;
    }
    if (options.reuse_address) {
      BOOL enabled = TRUE;
      ::setsockopt(socket, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&enabled), sizeof(enabled));
    }
    if (::bind(socket, current->ai_addr, static_cast<int>(current->ai_addrlen)) == 0 && ::listen(socket, options.backlog) == 0) {
      return net_handle_from_socket(socket);
    }
    auto ownedFd = net_handle_from_socket(socket);
    close_fd_if_open(ownedFd);
  }
  throw std::runtime_error("Unable to listen with Jayess net server");
}

void start_accept_thread(const net_server_ptr& server, value handler) {
  if (!std::holds_alternative<callable_ptr>(handler)) {
    return;
  }
  server->accept_thread = std::thread([server, handler]() mutable {
    for (;;) {
      net_handle_t serverFd = -1;
      {
        std::lock_guard<std::mutex> lock(server->mutex);
        if (server->closed || server->fd == -1) {
          return;
        }
        serverFd = server->fd;
      }

      const auto accepted = ::accept(net_socket_from_handle(serverFd), nullptr, nullptr);
      if (accepted == INVALID_SOCKET) {
        std::lock_guard<std::mutex> lock(server->mutex);
        if (server->closed) {
          return;
        }
        continue;
      }

      try {
        call(handler, make_net_socket(net_handle_from_socket(accepted)));
      } catch (...) {
        auto ownedFd = net_handle_from_socket(accepted);
        close_fd_if_open(ownedFd);
      }
    }
  });
}

value net_listen_platform(const std::string& host, int port, const value& handler, const value& optionsValue) {
  const auto options = parse_net_options(optionsValue, true);
  auto server = std::make_shared<net_server_state>();
  server->fd = open_server_socket(host, port, options);
  const auto local = net_endpoint_for_fd(server->fd, true);
  server->local_address = local.first;
  server->local_port = local.second;
  start_accept_thread(server, handler);
  return server;
}

value net_read_platform(const value& input) {
  const auto socket = require_net_socket(input);
  std::lock_guard<std::mutex> lock(socket->mutex);
  require_open_socket(socket);

  std::vector<unsigned char> buffer(4096);
  const auto count = ::recv(net_socket_from_handle(socket->fd), reinterpret_cast<char*>(buffer.data()), static_cast<int>(buffer.size()), 0);
  if (count == SOCKET_ERROR) {
    throw net_socket_error("Unable to read");
  }
  if (count == 0) {
    return value(std::monostate{});
  }
  buffer.resize(static_cast<std::size_t>(count));
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(buffer);
  return bytes;
}

value net_write_platform(const value& input, const value& data) {
  const auto socket = require_net_socket(input);
  const auto bytes = require_net_bytes(data);
  std::lock_guard<std::mutex> lock(socket->mutex);
  require_open_socket(socket);

  std::size_t offset = 0;
  while (offset < bytes->items.size()) {
    const auto remaining = bytes->items.size() - offset;
    const auto chunk = static_cast<int>(std::min<std::size_t>(remaining, static_cast<std::size_t>(std::numeric_limits<int>::max())));
    const auto count = ::send(
      net_socket_from_handle(socket->fd),
      reinterpret_cast<const char*>(bytes->items.data() + offset),
      chunk,
      0
    );
    if (count == SOCKET_ERROR || count == 0) {
      throw net_socket_error("Unable to write");
    }
    offset += static_cast<std::size_t>(count);
  }
  return value(std::monostate{});
}

value net_local_address_platform(const value& handle) {
  if (std::holds_alternative<net_socket_ptr>(handle)) {
    const auto socket = std::get<net_socket_ptr>(handle);
    std::lock_guard<std::mutex> lock(socket->mutex);
    require_open_socket(socket);
    return socket->local_address;
  }
  if (std::holds_alternative<net_server_ptr>(handle)) {
    const auto server = std::get<net_server_ptr>(handle);
    std::lock_guard<std::mutex> lock(server->mutex);
    require_open_server(server);
    return server->local_address;
  }
  throw_invalid_handle("net", "socket or server");
}

value net_local_port_platform(const value& handle) {
  if (std::holds_alternative<net_socket_ptr>(handle)) {
    const auto socket = std::get<net_socket_ptr>(handle);
    std::lock_guard<std::mutex> lock(socket->mutex);
    require_open_socket(socket);
    return static_cast<double>(socket->local_port);
  }
  if (std::holds_alternative<net_server_ptr>(handle)) {
    const auto server = std::get<net_server_ptr>(handle);
    std::lock_guard<std::mutex> lock(server->mutex);
    require_open_server(server);
    return static_cast<double>(server->local_port);
  }
  throw_invalid_handle("net", "socket or server");
}

value net_remote_address_platform(const value& input) {
  const auto socket = require_net_socket(input);
  std::lock_guard<std::mutex> lock(socket->mutex);
  require_open_socket(socket);
  return socket->remote_address;
}

value net_remote_port_platform(const value& input) {
  const auto socket = require_net_socket(input);
  std::lock_guard<std::mutex> lock(socket->mutex);
  require_open_socket(socket);
  return static_cast<double>(socket->remote_port);
}

value net_close_platform(const value& handle) {
  if (std::holds_alternative<net_socket_ptr>(handle)) {
    const auto socket = std::get<net_socket_ptr>(handle);
    std::lock_guard<std::mutex> lock(socket->mutex);
    if (!socket->closed) {
      close_fd_if_open(socket->fd);
      socket->closed = true;
    }
    return value(std::monostate{});
  }
  if (std::holds_alternative<net_server_ptr>(handle)) {
    const auto server = std::get<net_server_ptr>(handle);
    {
      std::lock_guard<std::mutex> lock(server->mutex);
      if (!server->closed) {
        close_fd_if_open(server->fd);
        server->closed = true;
      }
    }
    if (server->accept_thread.joinable()) {
      server->accept_thread.join();
    }
    return value(std::monostate{});
  }
  throw_invalid_handle("net", "socket or server");
}
#endif`;
}
