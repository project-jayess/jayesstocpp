export function getAsyncCancellationRuntimeCppFragment() {
  return `value make_cancellation_token() {
  return std::make_shared<cancellation_token_state>();
}

bool is_cancellation_token(const value& input) {
  return std::holds_alternative<cancellation_token_ptr>(input);
}

value cancel_cancellation_token(const value& token, const value& reason) {
  const auto& state = require_cancellation_token_state(token);
  if (state->cancelled) {
    return token;
  }

  state->cancelled = true;
  state->reason = reason;
  auto continuations = std::move(state->continuations);
  auto& queue = async_scheduler_queue();
  for (auto& continuation : continuations) {
    queue.push_back(std::move(continuation));
  }
  return token;
}

value cancellation_token_cancelled(const value& token) {
  return require_cancellation_token_state(token)->cancelled;
}

value cancellation_token_reason(const value& token) {
  return require_cancellation_token_state(token)->reason;
}

value async_when_cancelled(const value& token) {
  const auto& state = require_cancellation_token_state(token);
  const auto result = make_pending_async();
  if (state->cancelled) {
    async_resolve(result, state->reason);
    return result;
  }

  state->continuations.push_back([result, token]() mutable {
    async_resolve(result, cancellation_token_reason(token));
  });
  return result;
}`;
}
