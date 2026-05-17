import {
  clear,
  create,
  deleteKey,
  get,
  has,
  isMap,
  set,
  size
} from "jayess:collections/map";

export function run() {
  var map = create();
  set(map, "name", "jayess");
  if (isMap(map) && has(map, "name")) {
    var count = size(map);
    var value = get(map, "name");
    deleteKey(map, "name");
    clear(map);
    if (count > 0) {
      return value;
    }
  }
  return "invalid";
}
