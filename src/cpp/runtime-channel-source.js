export function getChannelRuntimeHeaderFragment() {
  return `struct channel_state {
  std::deque<value> queue;
  bool closed = false;
  std::mutex mutex;
};

value channel_create();
value channel_send(const value& channel, const value& item);
value channel_receive(const value& channel);
value channel_close(const value& channel);
value channel_is_closed(const value& channel);`;
}

export function getChannelRuntimeCppFragment() {
  return `namespace {
channel_ptr require_channel_handle(const value& input) {
  if (!std::holds_alternative<channel_ptr>(input)) {
    throw_invalid_handle("channel", "channel");
  }
  return std::get<channel_ptr>(input);
}
} // namespace

value channel_create() {
  return std::make_shared<channel_state>();
}

value channel_send(const value& channel, const value& item) {
  const auto state = require_channel_handle(channel);
  std::lock_guard<std::mutex> lock(state->mutex);
  if (state->closed) {
    throw_closed_handle("channel", "channel");
  }
  state->queue.push_back(item);
  return channel;
}

value channel_receive(const value& channel) {
  const auto state = require_channel_handle(channel);
  std::lock_guard<std::mutex> lock(state->mutex);
  if (state->queue.empty()) {
    return value(std::monostate{});
  }
  auto item = state->queue.front();
  state->queue.pop_front();
  return item;
}

value channel_close(const value& channel) {
  const auto state = require_channel_handle(channel);
  std::lock_guard<std::mutex> lock(state->mutex);
  state->closed = true;
  return channel;
}

value channel_is_closed(const value& channel) {
  const auto state = require_channel_handle(channel);
  std::lock_guard<std::mutex> lock(state->mutex);
  return state->closed;
}`;
}
