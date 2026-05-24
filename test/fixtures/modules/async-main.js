import {
  all,
  allSettled,
  any,
  catchError,
  delay,
  finallyDo,
  isAsync,
  race,
  rejected,
  resolved,
  retry,
  sleep,
  timeout
} from "jayess:async";

export async function run() {
  var first = resolved(1);
  var second = resolved(2);
  var cleanup = [];
  var attempts = 0;
  function recover(error) {
    return "caught:" + error;
  }
  function remember() {
    cleanup.push("done");
    return null;
  }
  function eventually() {
    attempts = attempts + 1;
    if (attempts < 3) {
      return rejected("again");
    }
    return resolved("retried");
  }
  var joined = await all([first, second]);
  var settled = await allSettled([first, rejected("late")]);
  var firstResolved = await any([rejected("skip"), resolved(4)]);
  var raced = await race([resolved(3), rejected("boom")]);
  var slept = await sleep(0);
  var guarded = await timeout(resolved(5), 0);
  var caught = await catchError(rejected("bad"), recover);
  var finalized = await finallyDo(resolved("value"), remember);
  var delayed = await delay("later", 0);
  var retried = await retry(eventually, 3);
  return [isAsync(first), joined, settled, firstResolved, raced, slept, guarded, caught, cleanup.length, finalized, delayed, retried];
}
