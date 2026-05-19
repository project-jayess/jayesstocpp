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

export function run(root) {
  var joined = join(root, "src", "..", "main.js");
  var normalized = normalize(joined);
  var folder = dirname(normalized);
  var file = basename(normalized);
  var extension = extname(normalized);
  var resolved = resolve(root, file);
  var rel = relative(root, resolved);
  return folder + file + extension + rel + isAbsolute(resolved);
}
