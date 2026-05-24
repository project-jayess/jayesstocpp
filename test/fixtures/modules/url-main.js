import { format, getQuery, joinPath, parse, setQuery } from "jayess:url";

export function run() {
  var original = "https://example.com/docs/start?lang=js#top";
  var parts = parse(original);
  var updated = setQuery(original, "lang", "jayess");
  return [
    parts.scheme,
    parts.host,
    parts.path,
    getQuery(updated, "lang"),
    joinPath(updated, "next"),
    format(parts)
  ];
}
