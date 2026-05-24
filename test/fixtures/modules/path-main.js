import {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  separator
} from "jayess:path";

export function run(root) {
  var joined = join(root, "src", "..", "main.js");
  var normalized = normalize(joined);
  var folder = dirname(normalized);
  var file = basename(normalized);
  var extension = extname(normalized);
  var parsed = parse(normalized);
  var formatted = format(parsed);
  var resolved = resolve(root, file);
  var rel = relative(root, resolved);
  return folder + file + extension + rel + isAbsolute(resolved) + formatted + separator() + delimiter();
}
