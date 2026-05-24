import { all, allSettled, any, race, rejected, resolved } from "jayess:async";

export async function run() {
  var joined = await all([resolved(1), resolved(2)]);
  var settled = await allSettled([resolved(1), rejected("late")]);
  var firstResolved = await any([rejected("skip"), resolved(4)]);
  var raced = await race([resolved(3), rejected("boom")]);
  return [joined, settled, firstResolved, raced];
}
