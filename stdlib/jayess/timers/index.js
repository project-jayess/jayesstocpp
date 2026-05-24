import {
  jayessTimersClearInterval,
  jayessTimersClearTimeout,
  jayessTimersSetInterval,
  jayessTimersSetTimeout,
  jayessTimersSleep
} from "./timers-primitives.hpp";

export function sleep(milliseconds) {
  return jayessTimersSleep(milliseconds);
}

export function setTimeout(callback, milliseconds, args) {
  return jayessTimersSetTimeout(callback, milliseconds, args);
}

export function clearTimeout(handle) {
  return jayessTimersClearTimeout(handle);
}

export function setInterval(callback, milliseconds, args) {
  return jayessTimersSetInterval(callback, milliseconds, args);
}

export function clearInterval(handle) {
  return jayessTimersClearInterval(handle);
}
