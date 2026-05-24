import { field, parseUrlEncoded, stringifyUrlEncoded } from "jayess:form";
import { formatJson } from "jayess:log";
import { charset, extension, isText, lookup } from "jayess:mime";
import { get, has, parse as parseQuery, set, stringify as stringifyQuery } from "jayess:querystring";
import { parse as parseToml, stringify as stringifyToml } from "jayess:toml";

export function run() {
  var query = parseQuery("?name=Jayess&empty=&space=hello+world");
  set(query, "mode", "native");
  var form = parseUrlEncoded("title=Jayess&kind=language");
  var config = parseToml("[package]\nname = \"jayess\"\nactive = true\ncount = 3");
  var tomlText = stringifyToml({ package: { name: "jayess", active: true } });
  return [
    get(query, "name"),
    get(query, "space"),
    has(query, "mode"),
    stringifyQuery({ name: "Jayess", mode: "native" }),
    field(form, "kind"),
    stringifyUrlEncoded({ title: "Jayess" }),
    lookup("index.html"),
    extension("application/json; charset=utf-8"),
    isText("application/json"),
    charset("text/plain; charset=utf-8"),
    config.package.name,
    config.package.active,
    config.package.count,
    tomlText.includes("[package]"),
    formatJson("info", { ok: true }).includes("\"level\":\"info\"")
  ];
}
