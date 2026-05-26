import { pathname, query, queryParam, url } from "jayess:http";

function request(pathValue) {
  return {
    method: "GET",
    path: pathValue,
    headers: {},
    body: ""
  };
}

export function inspectRequestHelpers() {
  var current = request("/users/42?tab=profile&empty=");
  var values = query(current);
  var plain = request("/health");
  return [
    url(current),
    pathname(current),
    queryParam(current, "tab"),
    queryParam(current, "missing") === null,
    values.empty,
    pathname(plain)
  ];
}
