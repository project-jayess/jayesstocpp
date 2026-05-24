import { elapsed, formatDuration, millis, minutes, seconds } from "jayess:time";

export function inspect() {
  var start = millis();
  var later = millis();
  return [
    later >= start,
    elapsed(start) >= 0,
    seconds(2.5),
    minutes(1.5),
    formatDuration(0),
    formatDuration(61001),
    formatDuration(-1500)
  ];
}

export function invalidSecondsInput() {
  return seconds("2");
}

export function invalidElapsedInput() {
  return elapsed("now");
}

export function invalidFormatInput() {
  return formatDuration(false);
}
