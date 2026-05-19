import {
  jayessAsyncAll,
  jayessAsyncAllSettled,
  jayessAsyncAny,
  jayessAsyncIsAsync,
  jayessAsyncRace,
  jayessAsyncRejected,
  jayessAsyncResolved
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

export function isAsync(value) {
  return jayessAsyncIsAsync(value);
}
