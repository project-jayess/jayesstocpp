export function getThreadRuntimeHeaderFragment() {
  return `value thread_spawn(const value& callback, const value& args);
value thread_join(const value& input);
value thread_sleep_for_milliseconds(int milliseconds);
value thread_hardware_concurrency();
value thread_current_id();
bool is_thread_value(const value& input);`;
}

export function getThreadRuntimeCppFragment() {
  return `struct thread_state {
  std::thread worker;
  std::mutex mutex;
  bool joined = false;
  bool detached = false;
  bool completed = false;
  bool failed = false;
  value result = value(std::monostate{});

  ~thread_state() {
    if (worker.joinable()) {
      worker.join();
    }
  }
};

namespace {
thread_ptr require_thread_handle(const value& input) {
  if (!std::holds_alternative<thread_ptr>(input)) {
    throw_invalid_handle("thread", "thread");
  }
  return std::get<thread_ptr>(input);
}

array_ptr require_thread_arg_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess thread spawn expects an array of arguments");
  }
  return std::get<array_ptr>(input);
}

callable_ptr require_thread_callback(const value& input) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error("Jayess thread spawn expects a callable callback");
  }
  return std::get<callable_ptr>(input);
}

value transfer_thread_value(const value& input);

std::vector<value> transfer_thread_array_items(const array_ptr& input) {
  std::vector<value> items;
  items.reserve(input->items.size());
  for (const auto& item : input->items) {
    items.push_back(transfer_thread_value(item));
  }
  return items;
}

value transfer_thread_object_value(const object_ptr& input) {
  std::vector<std::pair<std::string, value>> fields;
  fields.reserve(input->fields.size());
  for (const auto& [key, stored] : input->fields) {
    fields.push_back({key, transfer_thread_value(stored)});
  }
  return make_object(std::move(fields));
}

value transfer_thread_value(const value& input) {
  if (
    std::holds_alternative<std::monostate>(input)
    || std::holds_alternative<double>(input)
    || std::holds_alternative<bool>(input)
    || std::holds_alternative<std::string>(input)
    || std::holds_alternative<channel_ptr>(input)
  ) {
    return input;
  }

  if (std::holds_alternative<array_ptr>(input)) {
    return make_array(transfer_thread_array_items(std::get<array_ptr>(input)));
  }

  if (std::holds_alternative<object_ptr>(input)) {
    return transfer_thread_object_value(std::get<object_ptr>(input));
  }

  throw std::runtime_error("Value cannot cross a Jayess thread boundary");
}
} // namespace

bool is_thread_value(const value& input) {
  return std::holds_alternative<thread_ptr>(input);
}

value thread_spawn(const value& callback, const value& args) {
  const auto callable = require_thread_callback(callback);
  const auto argArray = require_thread_arg_array(args);
  auto transferredArgs = transfer_thread_array_items(argArray);
  auto state = std::make_shared<thread_state>();

  state->worker = std::thread([state, callable, transferredArgs = std::move(transferredArgs)]() mutable {
    try {
      value result = transfer_thread_value(callable->fn(transferredArgs));
      std::lock_guard<std::mutex> lock(state->mutex);
      state->result = std::move(result);
      state->completed = true;
    } catch (const thrown_value& error) {
      std::lock_guard<std::mutex> lock(state->mutex);
      try {
        state->result = transfer_thread_value(error.payload);
      } catch (const std::exception& transferError) {
        state->result = std::string(transferError.what());
      }
      state->failed = true;
      state->completed = true;
    } catch (const std::exception& error) {
      std::lock_guard<std::mutex> lock(state->mutex);
      state->result = std::string(error.what());
      state->failed = true;
      state->completed = true;
    }
  });

  return state;
}

value thread_join(const value& input) {
  const auto state = require_thread_handle(input);
  if (state->joined) {
    throw_completed_handle("thread", "thread", "joined");
  }
  if (state->worker.joinable()) {
    state->worker.join();
  }
  state->joined = true;

  std::lock_guard<std::mutex> lock(state->mutex);
  if (!state->completed) {
    throw std::runtime_error("Jayess thread did not complete");
  }
  if (state->failed) {
    throw_value(state->result);
  }
  return state->result;
}

value thread_sleep_for_milliseconds(int milliseconds) {
  if (milliseconds < 0) {
    throw std::runtime_error("Jayess thread sleep expects a non-negative integer");
  }
  std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
  return value(std::monostate{});
}

value thread_hardware_concurrency() {
  const auto count = std::thread::hardware_concurrency();
  return static_cast<double>(count == 0 ? 1 : count);
}

value thread_current_id() {
  std::ostringstream stream;
  stream << std::this_thread::get_id();
  return stream.str();
}`;
}
