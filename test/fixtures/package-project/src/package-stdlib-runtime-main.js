import { root, tool } from "package-project";
import { parse as parseQuery } from "jayess:querystring";
import { lookup } from "jayess:mime";

export function run() {
  var query = parseQuery("name=Jayess");
  return [root, tool(), query.name, lookup("index.html")];
}
