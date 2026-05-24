import { next } from "jayess:iter";

function* choose(flag, first, second) {
  var value = flag ? (yield first) : (yield second);
  return value;
}

export function run() {
  var left = choose(true, "left", "right");
  var right = choose(false, "left", "right");
  var first = next(left);
  var second = next(right);
  var doneLeft = next(left, "done-left");
  var doneRight = next(right, "done-right");
  return [
    first.value,
    second.value,
    doneLeft.value,
    doneRight.value
  ];
}
