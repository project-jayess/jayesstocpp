import {
  jayessWatchClose,
  jayessWatchCreate,
  jayessWatchIsWatcher,
  jayessWatchPoll
} from "./watch-primitives.hpp";

export function watch(path, options) {
  return jayessWatchCreate(path, options);
}

export function poll(watcher) {
  return jayessWatchPoll(watcher);
}

export function close(watcher) {
  return jayessWatchClose(watcher);
}

export function isWatcher(value) {
  return jayessWatchIsWatcher(value);
}
