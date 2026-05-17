import {
  createDirectories,
  exists,
  readText,
  writeText
} from "jayess:fs";
import {
  basename,
  dirname,
  extname,
  join,
  normalize
} from "jayess:path";
import {
  cwd,
  getEnv
} from "jayess:process";

export function run() {
  var tempDir = join("temp", "jayess");
  var normalized = normalize(join("temp", "..", "jayess.txt"));
  var folder = dirname(normalized);
  var name = basename(normalized);
  var ext = extname(normalized);
  var current = cwd();
  var envValue = getEnv("JAYESS_TEST");

  createDirectories(tempDir);
  writeText(normalized, current);
  if (exists(normalized)) {
    var text = readText(normalized);
    return name + ext + folder + text + envValue;
  }
  return current;
}
