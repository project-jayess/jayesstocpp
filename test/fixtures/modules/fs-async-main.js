import {
  appendText,
  copy,
  createDirectories,
  exists,
  list,
  readBytes,
  readText,
  remove,
  rename,
  stat,
  writeBytes,
  writeText
} from "jayess:fs";
import { fromUtf8, toUtf8 } from "jayess:bytes";

export async function run(root) {
  var path = root + "/async.txt";
  var moved = root + "/async-moved.txt";
  var copied = root + "/async-copy.txt";
  await createDirectories(root);
  await writeText(path, "Jay");
  await appendText(path, "ess");
  await copy(path, copied);
  var text = await readText(copied);
  await writeBytes(path, fromUtf8(text));
  var bytes = await readBytes(path);
  var present = await exists(path);
  var details = await stat(path);
  var entries = await list(root);
  await rename(path, moved);
  await remove(moved);
  await remove(copied);
  return toUtf8(bytes) + present + details.isFile + entries.length;
}
