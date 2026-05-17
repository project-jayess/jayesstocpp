import {
  add,
  clear,
  create,
  deleteValue,
  has,
  isSet,
  size
} from "jayess:collections/set";

export function run() {
  var values = create();
  add(values, "jayess");
  if (isSet(values) && has(values, "jayess")) {
    var count = size(values);
    deleteValue(values, "jayess");
    clear(values);
    if (count > 0) {
      return "jayess";
    }
  }
  return "invalid";
}
