import {
  jayessEventsCreate,
  jayessEventsEmit,
  jayessEventsListenerCount,
  jayessEventsOff,
  jayessEventsOn,
  jayessEventsOnce
} from "./events-primitives.hpp";

export function create() {
  return jayessEventsCreate();
}

export function on(emitter, name, callback) {
  return jayessEventsOn(emitter, name, callback);
}

export function once(emitter, name, callback) {
  return jayessEventsOnce(emitter, name, callback);
}

export function off(emitter, name, callback) {
  return jayessEventsOff(emitter, name, callback);
}

export function emit(emitter, name, ...args) {
  return jayessEventsEmit(emitter, name, args);
}

export function listenerCount(emitter, name) {
  return jayessEventsListenerCount(emitter, name);
}
