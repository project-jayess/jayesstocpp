import {
  jayessDateAddMillis,
  jayessDateFromUnixMillis,
  jayessDateDiffMillis,
  jayessDateGetUtcDay,
  jayessDateGetUtcHour,
  jayessDateGetUtcMillisecond,
  jayessDateGetUtcMinute,
  jayessDateGetUtcMonth,
  jayessDateGetUtcSecond,
  jayessDateGetUtcYear,
  jayessDateNow,
  jayessDateParseIso,
  jayessDateToIsoString,
  jayessDateToUnixMillis,
  jayessIsDateValue
} from "./date-primitives.hpp";

export function now() {
  return jayessDateNow();
}

export function fromUnixMillis(value) {
  return jayessDateFromUnixMillis(value);
}

export function toUnixMillis(date) {
  return jayessDateToUnixMillis(date);
}

export function toIsoString(date) {
  return jayessDateToIsoString(date);
}

export function getUtcYear(date) {
  return jayessDateGetUtcYear(date);
}

export function getUtcMonth(date) {
  return jayessDateGetUtcMonth(date);
}

export function getUtcDay(date) {
  return jayessDateGetUtcDay(date);
}

export function getUtcHour(date) {
  return jayessDateGetUtcHour(date);
}

export function getUtcMinute(date) {
  return jayessDateGetUtcMinute(date);
}

export function getUtcSecond(date) {
  return jayessDateGetUtcSecond(date);
}

export function getUtcMillisecond(date) {
  return jayessDateGetUtcMillisecond(date);
}

export function addMillis(date, amount) {
  return jayessDateAddMillis(date, amount);
}

export function diffMillis(left, right) {
  return jayessDateDiffMillis(left, right);
}

export function parseIso(text) {
  return jayessDateParseIso(text);
}

export function isDate(value) {
  return jayessIsDateValue(value);
}
