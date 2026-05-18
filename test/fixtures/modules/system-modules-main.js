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
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve
} from "jayess:path";
import {
  argv,
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
  var args = argv();
  var resolved = resolve(tempDir, "..", "jayess.txt");
  var rel = relative(tempDir, resolved);
  var absolute = isAbsolute(resolved);
  var moved = join(tempDir, "jayess-moved.txt");

  createDirectories(tempDir);
  writeText(normalized, current);
  if (exists(normalized)) {
    var entries = list(tempDir);
    var before = stat(normalized);
    rename(normalized, moved);
    var text = readText(moved);
    var after = stat(moved);
    remove(moved);
    return name + ext + folder + text + envValue + resolved + rel + absolute + args.length + entries.length + before.size + after.isFile;
  }
  return current;
}
