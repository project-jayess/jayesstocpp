import { format, getQuery, joinPath, parse, setQuery } from "jayess:url";

export function inspect() {
  var relative = parse("/docs/start?lang=js#top");
  return [
    relative.scheme,
    relative.host,
    relative.path,
    relative.query,
    relative.fragment,
    format({ host: "example.com" }),
    joinPath("https://example.com/docs/start?lang=js#top", "next"),
    joinPath("https://example.com/docs/start?lang=js#top", "/reset"),
    getQuery("https://example.com/?tag=one&tag=two", "tag"),
    getQuery("https://example.com/?tag=one", "missing"),
    setQuery("https://example.com/?tag=one&mode=old#frag", "mode", "new"),
    setQuery("https://example.com/docs", "lang", "jayess")
  ];
}

export function invalidParseInput() {
  return parse(1);
}

export function invalidFormatInput() {
  return format("https://example.com");
}

export function invalidFormatField() {
  return format({ path: 1 });
}

export function invalidJoinPathInput() {
  return joinPath("https://example.com", 1);
}

export function invalidGetQueryKey() {
  return getQuery("https://example.com/?tag=one", 1);
}

export function invalidSetQueryValue() {
  return setQuery("https://example.com/?tag=one", "tag", false);
}
