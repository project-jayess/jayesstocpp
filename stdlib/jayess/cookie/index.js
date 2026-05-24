import { header as httpHeader, setHeader } from "jayess:http";
import { split, trim } from "jayess:string";

function fail(message) {
  throw message;
}

function requireToken(value, message) {
  if (value === null || value === "") {
    fail(message);
  }
  if (split(value, " ").length > 1 || split(value, ";").length > 1 || split(value, "=").length > 1) {
    fail(message);
  }
  return value;
}

function requireCookieValue(value) {
  if (value === null) {
    fail("jayess:cookie value must be a string");
  }
  if (split(value, ";").length > 1) {
    fail("jayess:cookie value must not contain semicolons");
  }
  return value;
}

function optionValue(options, key, fallback) {
  if (options === null) {
    return fallback;
  }
  var value = options[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

export function parse(header) {
  var result = {};
  if (header === null || header === "") {
    return result;
  }
  var pairs = split(header, ";");
  for (var index = 0; index < pairs.length; index = index + 1) {
    var part = trim(pairs[index]);
    var pieces = split(part, "=");
    if (pieces.length >= 2) {
      var name = trim(pieces[0]);
      var value = trim(pieces[1]);
      if (name !== "") {
        result[name] = value;
      }
    }
  }
  return result;
}

export function serialize(name, value, options) {
  var text = requireToken(name, "jayess:cookie name must be a valid token") + "=" + requireCookieValue(value);
  var path = optionValue(options, "path", null);
  if (path !== null) {
    text = text + "; Path=" + requireCookieValue(path);
  }
  var domain = optionValue(options, "domain", null);
  if (domain !== null) {
    text = text + "; Domain=" + requireCookieValue(domain);
  }
  var maxAge = optionValue(options, "maxAge", null);
  if (maxAge !== null) {
    text = text + "; Max-Age=" + maxAge;
  }
  var expires = optionValue(options, "expires", null);
  if (expires !== null) {
    text = text + "; Expires=" + requireCookieValue(expires);
  }
  if (optionValue(options, "httpOnly", false)) {
    text = text + "; HttpOnly";
  }
  if (optionValue(options, "secure", false)) {
    text = text + "; Secure";
  }
  var sameSite = optionValue(options, "sameSite", null);
  if (sameSite !== null) {
    text = text + "; SameSite=" + requireToken(sameSite, "jayess:cookie sameSite must be a valid token");
  }
  return text;
}

export function get(request, name) {
  return parse(httpHeader(request, "cookie"))[name];
}

export function set(response, name, value, options) {
  setHeader(response, "Set-Cookie", serialize(name, value, options));
  return response;
}
