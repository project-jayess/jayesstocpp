import {
  elapsed,
  formatDuration,
  millis,
  minutes,
  seconds
} from "jayess:time";

export function run() {
  var started = millis();
  var spent = elapsed(started);
  return formatDuration(spent) + formatDuration(seconds(2)) + formatDuration(minutes(1));
}
