import {
  add,
  clear,
  create,
  deleteValue,
  entries,
  has,
  isSet,
  size,
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
    deleteValue(set, "jayess");
    clear(set);
    if (count > 0) {
      return ["jayess", valueList, entryList];
    }
  }
  return "invalid";
}
