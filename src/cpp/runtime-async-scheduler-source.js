export function getAsyncSchedulerRuntimeCppFragment() {
  return `namespace {
std::deque<std::function<void()>>& async_scheduler_queue() {
  static std::deque<std::function<void()>> queue;
  return queue;
}

struct async_timer_record {
  std::chrono::steady_clock::time_point due;
  std::function<void()> continuation;
};

std::vector<async_timer_record>& async_scheduler_timers() {
  static std::vector<async_timer_record> timers;
  return timers;
}

const async_ptr& require_async_state(const value& input) {
  if (!std::holds_alternative<async_ptr>(input)) {
    throw_invalid_handle("async", "async");
  }

  return std::get<async_ptr>(input);
}

const cancellation_token_ptr& require_cancellation_token_state(const value& input) {
  if (!std::holds_alternative<cancellation_token_ptr>(input)) {
    throw_invalid_handle("async", "cancellation token");
  }

  return std::get<cancellation_token_ptr>(input);
}

void async_schedule_timer(int milliseconds, std::function<void()> continuation) {
  async_scheduler_timers().push_back({
    std::chrono::steady_clock::now() + std::chrono::milliseconds(milliseconds),
    std::move(continuation)
  });
}

void async_enqueue_due_timers() {
  const auto now = std::chrono::steady_clock::now();
  auto& timers = async_scheduler_timers();
  auto& queue = async_scheduler_queue();
  for (auto iterator = timers.begin(); iterator != timers.end();) {
    if (iterator->due <= now) {
      queue.push_back(std::move(iterator->continuation));
      iterator = timers.erase(iterator);
      continue;
    }
    ++iterator;
  }
}
} // namespace`;
}
