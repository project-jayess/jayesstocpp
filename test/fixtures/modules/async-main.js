import { all, allSettled, any, isAsync, race, rejected, resolved } from "jayess:async";

export async function run() {
  var first = resolved(1);
  var second = resolved(2);
  var joined = await all([first, second]);
  var settled = await allSettled([first, rejected("late")]);
  var firstResolved = await any([rejected("skip"), resolved(4)]);
  var raced = await race([resolved(3), rejected("boom")]);
  return [isAsync(first), joined, settled, firstResolved, raced];
}
