import {
  deleteKeySync,
  getSync,
  hasSync,
  keysSync,
  open,
  setSync
} from "jayess:kv";

export function writeRead(root) {
  var store = open(root, null);
  setSync(store, "answer", { value: 42 });
  return getSync(store, "answer").value;
}

export function keyCount(root) {
  var store = open(root, null);
  setSync(store, "alpha", true);
  setSync(store, "beta", false);
  return keysSync(store).length;
}

export function removeOne(root) {
  var store = open(root, null);
  setSync(store, "gone", "value");
  var before = hasSync(store, "gone");
  deleteKeySync(store, "gone");
  return before && !hasSync(store, "gone");
}

export function invalidKey(root) {
  var store = open(root, null);
  return setSync(store, "../bad", true);
}
