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
