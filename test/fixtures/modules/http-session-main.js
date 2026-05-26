import {
  getSignedCookie,
  setSignedCookie,
  signSession,
  verifySession
} from "jayess:http";

export function inspectSignedSession() {
  var signed = signSession("user-1", "secret");
  var request = {
    method: "GET",
    path: "/",
    headers: {
      cookie: "session=" + signed
    },
    body: ""
  };
  return [
    verifySession(signed, "secret"),
    verifySession(signed, "wrong") === null,
    getSignedCookie(request, "session", "secret"),
    signed.length > "user-1.".length
  ];
}

export function invalidSessionValue() {
  return signSession("bad.value", "secret");
}

export function writeSignedSession(response) {
  return setSignedCookie(response, "session", "user-1", "secret", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax"
  });
}
