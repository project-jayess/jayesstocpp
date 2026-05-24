import {
  createDirectoriesSync,
  copyRecursiveSync,
  existsSync,
  listSync,
  readJsonSync,
  readTextSync,
  removeRecursiveSync,
  removeSync,
  renameSync,
  statSync,
  tempDirectorySync,
  tempFileSync,
  walkSync,
  writeJsonSync,
  writeTextSync
} from "jayess:fs";

export function run(root) {
  var path = root + "/jayess.txt";
  var jsonPath = root + "/settings.json";
  var moved = root + "/jayess-moved.txt";
  createDirectoriesSync(root);
  writeTextSync(path, "Jayess");
  writeJsonSync(jsonPath, { name: "Jayess" });
  var json = readJsonSync(jsonPath);
  var present = existsSync(path);
  var details = statSync(path);
  var entries = listSync(root);
  var tempDir = tempDirectorySync("jayess-test");
  var tempPath = tempFileSync("jayess-test", ".txt");
  var nested = root + "/nested";
  var copied = root + "/copied";
  createDirectoriesSync(nested);
  writeTextSync(nested + "/child.txt", "Child");
  copyRecursiveSync(nested, copied);
  var walked = walkSync(root);
  var copiedText = readTextSync(copied + "/child.txt");
  removeRecursiveSync(nested);
  removeRecursiveSync(copied);
  renameSync(path, moved);
  var text = readTextSync(moved);
  removeSync(moved);
  removeSync(jsonPath);
  removeSync(tempPath);
  return text + present + details.isFile + entries.length + walked.length + copiedText + json.name + tempDir.length + tempPath.endsWith(".txt");
}
