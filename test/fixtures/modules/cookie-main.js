import { get, parse, serialize, set } from "jayess:cookie";

export function parseSession(header) {
  return parse(header).session;
}

export function serializeSession() {
  return serialize("session", "abc", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax"
  });
}

export function readSession(request) {
  return get(request, "session");
}

export function writeSession(response) {
  set(response, "session", "abc", { path: "/", httpOnly: true });
  return true;
}

export function invalidCookie() {
  return serialize("bad name", "abc", null);
}
