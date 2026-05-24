import { create, emit, listenerCount, off, on, once } from "jayess:events";

export function run() {
  var emitter = create();
  var log = [];
  function first(value) {
    log.push("first:" + value);
  }
  function second(value, suffix) {
    log.push("second:" + value + suffix);
  }

  on(emitter, "ready", first);
  once(emitter, "ready", second);
  var before = listenerCount(emitter, "ready");
  var firstCount = emit(emitter, "ready", "A", "!");
  var afterOnce = listenerCount(emitter, "ready");
  off(emitter, "ready", first);
  var afterOff = listenerCount(emitter, "ready");
  var secondCount = emit(emitter, "ready", "B", "?");

  return [log.join(","), before, firstCount, afterOnce, afterOff, secondCount];
}
