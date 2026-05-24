import { close, isWatcher, poll, watch } from "jayess:watch";

export function open(path) {
  var watcher = watch(path, {});
  return [watcher, isWatcher(watcher), poll(watcher).length];
}

export function readEvents(watcher) {
  return poll(watcher);
}

export function closeWatcher(watcher) {
  close(watcher);
  return true;
}

export function invalidPath() {
  return watch(123, {});
}
