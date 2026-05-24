import {
  jayessTimeElapsed,
  jayessTimeFormatDuration,
  jayessTimeMillis,
  jayessTimeMinutes,
  jayessTimeSeconds
} from "./time-primitives.hpp";

export function millis() {
  return jayessTimeMillis();
}

export function seconds(value) {
  return jayessTimeSeconds(value);
}

export function minutes(value) {
  return jayessTimeMinutes(value);
}

export function elapsed(start) {
  return jayessTimeElapsed(start);
}

export function formatDuration(milliseconds) {
  return jayessTimeFormatDuration(milliseconds);
}
