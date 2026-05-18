import { entries, keys, values } from "jayess:object";

export function run(data) {
  var allKeys = keys(data);
  var allValues = values(data);
  var allEntries = entries(data);
  return [allKeys, allValues, allEntries];
}
