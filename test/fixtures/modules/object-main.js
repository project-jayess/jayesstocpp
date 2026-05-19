import { assign, entries, fromEntries, has, keys, values } from "jayess:object";

export function run(data) {
  var allKeys = keys(data);
  var allValues = values(data);
  var allEntries = entries(data);
  var copied = assign({ active: true }, data);
  var built = fromEntries([["name", "jayess"], ["score", 1]]);
  return [has(data, "name"), allKeys, allValues, allEntries, copied, built];
}
