import { createServer, sendText } from "jayess:http";

export function serveClosePolicy(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, "ok", { status: 200, contentType: "text/plain" });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function serveImplicitEnd(port) {
  return createServer(function(requestValue, response) {
    return null;
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}
