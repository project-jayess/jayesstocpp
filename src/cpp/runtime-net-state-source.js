export function getNetRuntimeStateFragment() {
  return `using net_handle_t = std::intptr_t;

struct net_socket_state {
  net_handle_t fd = -1;
  bool closed = false;
  std::string local_address;
  int local_port = 0;
  std::string remote_address;
  int remote_port = 0;
  std::mutex mutex;
};

struct net_server_state {
  net_handle_t fd = -1;
  bool closed = false;
  std::string local_address;
  int local_port = 0;
  std::thread accept_thread;
  std::mutex mutex;
};`;
}
