export function getAsyncRuntimeHeaderFragment() {
  return `enum class async_status {
  pending,
  resolved,
  rejected
};

struct async_state {
  async_status status = async_status::pending;
  value settled = std::monostate{};
  std::vector<std::function<void()>> continuations;
};

value make_pending_async();
value make_resolved_async(value resolved);
value make_rejected_async(value rejected);
bool is_async(const value& input);
value async_all(const value& handles);
value async_race(const value& handles);
value async_all_settled(const value& handles);
value async_any(const value& handles);
bool async_is_pending(const value& input);
bool async_is_resolved(const value& input);
bool async_is_rejected(const value& input);
value async_result_value(const value& input);
value await_sync(const value& input);
void async_resolve(const value& input, value resolved);
void async_reject(const value& input, value rejected);
void async_enqueue(const value& input, std::function<void()> continuation);
void run_async_scheduler();
`;
}

export function getAsyncRuntimeCppFragment() {
  return `namespace {
std::deque<std::function<void()>>& async_scheduler_queue() {
  static std::deque<std::function<void()>> queue;
  return queue;
}

const async_ptr& require_async_state(const value& input) {
  if (!std::holds_alternative<async_ptr>(input)) {
    throw std::runtime_error("Expected Jayess async handle");
  }

  return std::get<async_ptr>(input);
}

const array_ptr& require_async_handle_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Expected Jayess array of async handles");
  }

  return std::get<array_ptr>(input);
}

void require_async_handle_items(const array_ptr& array) {
  for (const auto& handle : array->items) {
    if (!is_async(handle)) {
      throw std::runtime_error("Jayess async composition requires async handles");
    }
  }
}
} // namespace

value make_pending_async() {
  return std::make_shared<async_state>();
}

value make_resolved_async(value resolved) {
  auto state = std::make_shared<async_state>();
  state->status = async_status::resolved;
  state->settled = std::move(resolved);
  return state;
}

value make_rejected_async(value rejected) {
  auto state = std::make_shared<async_state>();
  state->status = async_status::rejected;
  state->settled = std::move(rejected);
  return state;
}

bool is_async(const value& input) {
  return std::holds_alternative<async_ptr>(input);
}

value async_all(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_resolve(result, make_array({}));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto settled = std::make_shared<bool>(false);
  auto collected = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, settled, collected, handle, index]() mutable {
      if (*settled) {
        return;
      }

      if (async_is_rejected(handle)) {
        *settled = true;
        async_reject(result, async_result_value(handle));
        return;
      }

      (*collected)[index] = async_result_value(handle);
      *remaining -= 1;
      if (*remaining == 0) {
        *settled = true;
        async_resolve(result, make_array(std::move(*collected)));
      }
    });
  }

  return result;
}

value async_race(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_reject(result, value(std::string("Jayess async race requires at least one handle")));
    return result;
  }

  auto settled = std::make_shared<bool>(false);
  for (const auto& handle : array->items) {
    async_enqueue(handle, [result, settled, handle]() mutable {
      if (*settled) {
        return;
      }

      *settled = true;
      if (async_is_rejected(handle)) {
        async_reject(result, async_result_value(handle));
        return;
      }

      async_resolve(result, async_result_value(handle));
    });
  }

  return result;
}

value async_all_settled(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_resolve(result, make_array({}));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto collected = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, collected, handle, index]() mutable {
      if (async_is_rejected(handle)) {
        (*collected)[index] = make_object({
          {"status", value(std::string("rejected"))},
          {"reason", async_result_value(handle)}
        });
      } else {
        (*collected)[index] = make_object({
          {"status", value(std::string("resolved"))},
          {"value", async_result_value(handle)}
        });
      }

      *remaining -= 1;
      if (*remaining == 0) {
        async_resolve(result, make_array(std::move(*collected)));
      }
    });
  }

  return result;
}

value async_any(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_reject(result, value(std::string("Jayess async any requires at least one handle")));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto settled = std::make_shared<bool>(false);
  auto rejections = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, settled, rejections, handle, index]() mutable {
      if (*settled) {
        return;
      }

      if (async_is_resolved(handle)) {
        *settled = true;
        async_resolve(result, async_result_value(handle));
        return;
      }

      (*rejections)[index] = async_result_value(handle);
      *remaining -= 1;
      if (*remaining == 0) {
        *settled = true;
        async_reject(result, make_array(std::move(*rejections)));
      }
    });
  }

  return result;
}

bool async_is_pending(const value& input) {
  return require_async_state(input)->status == async_status::pending;
}

bool async_is_resolved(const value& input) {
  return require_async_state(input)->status == async_status::resolved;
}

bool async_is_rejected(const value& input) {
  return require_async_state(input)->status == async_status::rejected;
}

value async_result_value(const value& input) {
  const auto& state = require_async_state(input);
  if (state->status == async_status::pending) {
    throw std::runtime_error("Async result is not settled");
  }

  return state->settled;
}

value await_sync(const value& input) {
  if (!is_async(input)) {
    return input;
  }

  if (async_is_pending(input)) {
    run_async_scheduler();
  }

  if (async_is_pending(input)) {
    throw std::runtime_error("Awaited async result is still pending");
  }

  if (async_is_rejected(input)) {
    throw_value(async_result_value(input));
  }

  return async_result_value(input);
}

void async_resolve(const value& input, value resolved) {
  const auto& state = require_async_state(input);
  if (state->status != async_status::pending) {
    throw std::runtime_error("Async result already settled");
  }

  state->status = async_status::resolved;
  state->settled = std::move(resolved);
  auto continuations = std::move(state->continuations);
  auto& queue = async_scheduler_queue();
  for (auto& continuation : continuations) {
    queue.push_back(std::move(continuation));
  }
}

void async_reject(const value& input, value rejected) {
  const auto& state = require_async_state(input);
  if (state->status != async_status::pending) {
    throw std::runtime_error("Async result already settled");
  }

  state->status = async_status::rejected;
  state->settled = std::move(rejected);
  auto continuations = std::move(state->continuations);
  auto& queue = async_scheduler_queue();
  for (auto& continuation : continuations) {
    queue.push_back(std::move(continuation));
  }
}

void async_enqueue(const value& input, std::function<void()> continuation) {
  const auto& state = require_async_state(input);
  if (state->status == async_status::pending) {
    state->continuations.push_back(std::move(continuation));
    return;
  }

  async_scheduler_queue().push_back(std::move(continuation));
}

void run_async_scheduler() {
  auto& queue = async_scheduler_queue();
  while (!queue.empty()) {
    auto continuation = std::move(queue.front());
    queue.pop_front();
    continuation();
  }
}
`;
}
