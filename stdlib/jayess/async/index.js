import {
  jayessAsyncAll,
  jayessAsyncAllSettled,
  jayessAsyncAny,
  jayessAsyncCancel,
  jayessAsyncCancellationReason,
  jayessAsyncCatchError,
  jayessAsyncCreateCancellationToken,
  jayessAsyncDelay,
  jayessAsyncFinallyDo,
  jayessAsyncIsCancelled,
  jayessAsyncIsAsync,
  jayessAsyncRace,
  jayessAsyncRejected,
  jayessAsyncResolved,
  jayessAsyncRetry,
  jayessAsyncSleep,
  jayessAsyncSleepWithCancellation,
  jayessAsyncTimeout,
  jayessAsyncTimeoutWithCancellation,
  jayessAsyncWhenCancelled,
  jayessAsyncWithCancellation
} from "./async-primitives.hpp";

export function resolved(value) {
  return jayessAsyncResolved(value);
}

export function rejected(error) {
  return jayessAsyncRejected(error);
}

export function all(handles) {
  return jayessAsyncAll(handles);
}

export function allSettled(handles) {
  return jayessAsyncAllSettled(handles);
}

export function any(handles) {
  return jayessAsyncAny(handles);
}

export function race(handles) {
  return jayessAsyncRace(handles);
}

export function sleep(milliseconds) {
  return jayessAsyncSleep(milliseconds);
}

export function timeout(handle, milliseconds) {
  return jayessAsyncTimeout(handle, milliseconds);
}

export function withTimeout(handle, milliseconds) {
  return timeout(handle, milliseconds);
}

export function catchError(handle, callback) {
  return jayessAsyncCatchError(handle, callback);
}

export function finallyDo(handle, callback) {
  return jayessAsyncFinallyDo(handle, callback);
}

export function delay(value, milliseconds) {
  return jayessAsyncDelay(value, milliseconds);
}

export function retry(callback, count) {
  return jayessAsyncRetry(callback, count);
}

export function isAsync(value) {
  return jayessAsyncIsAsync(value);
}

export function createCancellationToken() {
  return jayessAsyncCreateCancellationToken();
}

export function cancel(token, reason) {
  return jayessAsyncCancel(token, reason);
}

export function isCancelled(token) {
  return jayessAsyncIsCancelled(token);
}

export function cancellationReason(token) {
  return jayessAsyncCancellationReason(token);
}

export function whenCancelled(token) {
  return jayessAsyncWhenCancelled(token);
}

export function withCancellation(handle, token) {
  return jayessAsyncWithCancellation(handle, token);
}

export function sleepWithCancellation(milliseconds, token) {
  return jayessAsyncSleepWithCancellation(milliseconds, token);
}

export function timeoutWithCancellation(handle, milliseconds, token) {
  return jayessAsyncTimeoutWithCancellation(handle, milliseconds, token);
}
