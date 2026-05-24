import { createServer, sendText } from "jayess:http";

export function serveProbe(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, "ok", { status: 200, contentType: "text/plain" });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}
