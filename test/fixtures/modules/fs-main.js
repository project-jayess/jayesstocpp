import {
  createDirectories,
  exists,
  list,
  readText,
  remove,
  rename,
  stat,
  writeText
} from "jayess:fs";

export function run(root) {
  var path = root + "/jayess.txt";
  var moved = root + "/jayess-moved.txt";
  createDirectories(root);
  writeText(path, "Jayess");
  var present = exists(path);
  var details = stat(path);
  var entries = list(root);
  rename(path, moved);
  var text = readText(moved);
  remove(moved);
  return text + present + details.isFile + entries.length;
}
