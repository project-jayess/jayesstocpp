import { delimiter, format, parse, separator } from "jayess:path";

export function inspectPath(path) {
  var parsed = parse(path);
  var formatted = format({
    dir: parsed.dir,
    base: parsed.base
  });

  return [
    parsed.root,
    parsed.dir,
    parsed.base,
    parsed.name,
    parsed.ext,
    formatted,
    separator(),
    delimiter()
  ];
}
