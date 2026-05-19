import {
  add,
  clear,
  create,
  deleteValue,
  difference,
  entries,
  fromValues,
  has,
  intersection,
  isSet,
  size,
  union,
  values
} from "jayess:collections/set";

export function run() {
  var set = create();
  add(set, "jayess");
  add(set, "native");
  if (isSet(set) && has(set, "jayess")) {
    var count = size(set);
    var valueList = values(set);
    var entryList = entries(set);
    var copied = fromValues(valueList);
    var either = union(copied, fromValues(["compiled"]));
    var both = intersection(either, copied);
    var leftOnly = difference(either, copied);
    deleteValue(set, "jayess");
    clear(set);
    if (count > 0) {
      return ["jayess", valueList, entryList, either, both, leftOnly];
    }
  }
  return "invalid";
}
