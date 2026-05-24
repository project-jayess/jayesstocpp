import { clearInterval, setInterval, sleep } from "jayess:timers";

var intervalCount = 0;
var intervalHandle = null;

function resetIntervalState() {
  intervalCount = 0;
  intervalHandle = null;
}

function tickInterval(input) {
  intervalCount = intervalCount + 1;
  return input + intervalCount;
}

export async function run(value) {
  resetIntervalState();
  intervalHandle = setInterval(function (input) {
    return tickInterval(input);
  }, 0, [value]);
  await sleep(0);
  await sleep(0);
  await sleep(0);
  clearInterval(intervalHandle);
  var finalResult = await intervalHandle.done;
  return [intervalCount, finalResult];
}
