import {
  clear,
  create,
  deleteAll,
  deleteKey,
  entries,
  fromEntries,
  get,
  has,
  isMap,
  keys,
  set,
  setAll,
  size,
  values
} from "jayess:collections/map";

export function run() {
  var map = create();
  set(map, "name", "jayess");
  set(map, "kind", "language");
  if (isMap(map) && has(map, "name")) {
    var count = size(map);
    var value = get(map, "name");
    var keyList = keys(map);
    var valueList = values(map);
    var entryList = entries(map);
    var copied = fromEntries(entryList);
    setAll(copied, [["stage", "bulk"]]);
    deleteAll(copied, ["kind"]);
    deleteKey(map, "name");
    clear(map);
    if (count > 0) {
      return [value, keyList, valueList, entryList, copied];
    }
  }
  return "invalid";
}
