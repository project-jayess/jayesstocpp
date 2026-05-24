import { getAsyncCancellationRuntimeCppFragment } from "./runtime-async-cancellation-source.js";
import { getAsyncCombinatorsRuntimeCppFragment } from "./runtime-async-combinators-source.js";
import { getAsyncHandleRuntimeCppFragment } from "./runtime-async-core-source.js";

export function getAsyncCoreRuntimeHeaderFragment() {
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

struct cancellation_token_state {
  bool cancelled = false;
  value reason = std::monostate{};
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
void async_schedule(std::function<void()> continuation);
void async_enqueue(const value& input, std::function<void()> continuation);
void run_async_scheduler();
value make_cancellation_token();
bool is_cancellation_token(const value& input);
value cancel_cancellation_token(const value& token, const value& reason);
value cancellation_token_cancelled(const value& token);
value cancellation_token_reason(const value& token);
value async_when_cancelled(const value& token);
`;
}

export function getAsyncHelpersRuntimeHeaderFragment() {
  return `value async_all(const value& handles);
value async_race(const value& handles);
value async_all_settled(const value& handles);
value async_any(const value& handles);
value async_sleep(const value& milliseconds);
value async_timeout(const value& handle, const value& milliseconds);
value async_catch_error(const value& handle, const value& callback);
value async_finally_do(const value& handle, const value& callback);
value async_delay(const value& input, const value& milliseconds);
value async_retry(const value& callback, const value& count);
value async_with_cancellation(const value& handle, const value& token);
value async_sleep_with_cancellation(const value& milliseconds, const value& token);
value async_timeout_with_cancellation(const value& handle, const value& milliseconds, const value& token);`;
}

export function getAsyncRuntimeHeaderFragment() {
  return `${getAsyncCoreRuntimeHeaderFragment()}
${getAsyncHelpersRuntimeHeaderFragment()}`;
}

export function getAsyncCoreRuntimeCppFragment() {
  return `${getAsyncHandleRuntimeCppFragment()}

${getAsyncCancellationRuntimeCppFragment()}`;
}

export function getAsyncHelpersRuntimeCppFragment() {
  return getAsyncCombinatorsRuntimeCppFragment();
}

export function getAsyncRuntimeCppFragment() {
  return `${getAsyncCoreRuntimeCppFragment()}
${getAsyncHelpersRuntimeCppFragment()}`;
}
