import { clearTimeout, setTimeout, sleep } from "jayess:timers";

export async function run(value) {
  await sleep(0);

  var first = setTimeout(function (input) {
    return input + 1;
  }, 0, [value]);

  var second = setTimeout(function (input) {
    return input + 2;
  }, 0, [value]);
  clearTimeout(second);

  return [await first.done, await second.done];
}
