import { get as getCookie, set as setCookie } from "jayess:cookie";
import { fromUtf8 } from "jayess:bytes";
import { hmacSha256 } from "jayess:crypto";
import { hexEncode } from "jayess:encoding";
import { split } from "jayess:string";

function fail(message) {
  throw message;
}

function requireSessionText(value, label) {
  if (value === null || value === "") {
    fail("jayess:http " + label + " must be a non-empty string");
  }
  if (split(value, ".").length !== 1 || split(value, ";").length !== 1) {
    fail("jayess:http " + label + " must not contain dots or semicolons");
  }
  return value;
}

function sessionSignature(value, secret) {
  return hexEncode(hmacSha256(fromUtf8(secret), fromUtf8(value)));
}

export function signSession(value, secret) {
  var payload = requireSessionText(value, "session value");
  var key = requireSessionText(secret, "session secret");
  return payload + "." + sessionSignature(payload, key);
}

export function verifySession(signedValue, secret) {
  if (signedValue === null || signedValue === "") {
    return null;
  }
  var key = requireSessionText(secret, "session secret");
  var parts = split(signedValue, ".");
  if (parts.length !== 2) {
    return null;
  }
  var expected = sessionSignature(parts[0], key);
  if (parts[1] !== expected) {
    return null;
  }
  return parts[0];
}

export function getSignedCookie(request, name, secret) {
  return verifySession(getCookie(request, name), secret);
}

export function setSignedCookie(response, name, value, secret, options) {
  setCookie(response, name, signSession(value, secret), options);
  return response;
}
