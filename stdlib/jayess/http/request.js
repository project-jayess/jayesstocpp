import { jayessHttpRequestPath } from "./http-primitives.hpp";
import { parse as parseQuery } from "jayess:querystring";
import { slice } from "jayess:string";

export function url(requestValue) {
  return jayessHttpRequestPath(requestValue);
}

export function pathname(requestValue) {
  var requestUrl = url(requestValue);
  var index = requestUrl.indexOf("?");
  if (index < 0) {
    return requestUrl;
  }
  return slice(requestUrl, 0, index);
}

export function queryParam(requestValue, name) {
  var requestUrl = url(requestValue);
  var index = requestUrl.indexOf("?");
  if (index < 0) {
    return null;
  }
  var values = parseQuery(slice(requestUrl, index + 1, requestUrl.length));
  return values[name] ?? null;
}
