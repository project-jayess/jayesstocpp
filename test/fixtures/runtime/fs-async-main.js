import {
  createDirectories,
  exists,
  list,
  readJson,
  readText,
  remove,
  stat,
  tempDirectory,
  tempFile,
  writeJson,
  writeText
} from "jayess:fs";

export async function run(root) {
  var path = root + "/async.txt";
  var jsonPath = root + "/settings.json";
  await createDirectories(root);
  await writeText(path, "Jayess");
  await writeJson(jsonPath, { name: "Jayess" });
  var text = await readText(path);
  var json = await readJson(jsonPath);
  var present = await exists(path);
  var details = await stat(path);
  var entries = await list(root);
  var tempDir = await tempDirectory("jayess-test");
  var tempPath = await tempFile("jayess-test", ".txt");
  await remove(path);
  await remove(jsonPath);
  await remove(tempPath);
  return [text, present, details.isFile, entries.length, json.name, tempDir.length > 0, tempPath.endsWith(".txt")];
}
