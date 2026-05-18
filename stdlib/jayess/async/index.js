import {
  jayessAsyncAll,
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

export function race(handles) {
  return jayessAsyncRace(handles);
}

export function isAsync(value) {
  return jayessAsyncIsAsync(value);
}
