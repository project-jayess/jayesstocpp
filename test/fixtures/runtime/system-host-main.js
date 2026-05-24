import {
  createDirectoriesSync,
  existsSync,
  listSync,
  readTextSync,
  removeSync,
  renameSync,
  statSync,
  writeTextSync
} from "jayess:fs";
import {
  isAbsolute,
  join,
  relative,
  resolve
} from "jayess:path";
import {
  argv,
  cwd
} from "jayess:process";

export function run(root) {
  var workspace = join(root, "host-runtime");
  var source = join(workspace, "jayess.txt");
  var moved = join(workspace, "jayess-moved.txt");

  createDirectoriesSync(workspace);
  writeTextSync(source, "Jayess");

  var beforeEntries = listSync(workspace);
  var beforeStat = statSync(source);
  var resolved = resolve(workspace, "..", "host-runtime", "jayess.txt");
  var rel = relative(workspace, resolved);
  var absolute = isAbsolute(resolved);

  renameSync(source, moved);

  var text = readTextSync(moved);
  var afterStat = statSync(moved);
  removeSync(moved);

  return [
    text,
    cwd(),
    argv().length,
    beforeEntries.length,
    beforeStat.isFile,
    afterStat.isFile,
    rel,
    absolute,
    existsSync(moved)
  ];
}
