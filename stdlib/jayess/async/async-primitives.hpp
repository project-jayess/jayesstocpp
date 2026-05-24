#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessAsyncResolved(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::make_resolved_async(input);
}

inline jayess::value jayessAsyncRejected(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::make_rejected_async(input);
}

inline jayess::value jayessAsyncAll(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_all(handles);
}

inline jayess::value jayessAsyncAllSettled(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_all_settled(handles);
}

inline jayess::value jayessAsyncAny(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_any(handles);
}

inline jayess::value jayessAsyncRace(const std::vector<jayess::value>& jayessArgs) {
  const auto handles = jayess::argument_at(jayessArgs, 0);
  return jayess::async_race(handles);
}

inline jayess::value jayessAsyncSleep(const std::vector<jayess::value>& jayessArgs) {
  const auto milliseconds = jayess::argument_at(jayessArgs, 0);
  return jayess::async_sleep(milliseconds);
}

inline jayess::value jayessAsyncTimeout(const std::vector<jayess::value>& jayessArgs) {
  const auto handle = jayess::argument_at(jayessArgs, 0);
  const auto milliseconds = jayess::argument_at(jayessArgs, 1);
  return jayess::async_timeout(handle, milliseconds);
}

inline jayess::value jayessAsyncCatchError(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_catch_error(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncFinallyDo(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_finally_do(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncDelay(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_delay(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncRetry(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_retry(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncIsAsync(const std::vector<jayess::value>& jayessArgs) {
  const auto input = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_async(input));
}

inline jayess::value jayessAsyncCreateCancellationToken(const std::vector<jayess::value>&) {
  return jayess::make_cancellation_token();
}

inline jayess::value jayessAsyncCancel(const std::vector<jayess::value>& jayessArgs) {
  return jayess::cancel_cancellation_token(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncIsCancelled(const std::vector<jayess::value>& jayessArgs) {
  return jayess::cancellation_token_cancelled(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessAsyncCancellationReason(const std::vector<jayess::value>& jayessArgs) {
  return jayess::cancellation_token_reason(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessAsyncWhenCancelled(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_when_cancelled(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessAsyncWithCancellation(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_with_cancellation(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncSleepWithCancellation(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_sleep_with_cancellation(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessAsyncTimeoutWithCancellation(const std::vector<jayess::value>& jayessArgs) {
  return jayess::async_timeout_with_cancellation(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}
