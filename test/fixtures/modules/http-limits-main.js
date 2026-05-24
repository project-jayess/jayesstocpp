import { createServer, path, sendText } from "jayess:http";

export function serveLimited(port, maxRequestBodyBytes, maxResponseBodyBytes) {
  return createServer(function(requestValue, response) {
    if (path(requestValue) === "/large-response") {
      return sendText(response, "response too large", { status: 200, contentType: "text/plain" });
    }
    return sendText(response, "ok", { status: 200, contentType: "text/plain" });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4,
    maxRequestBodyBytes: maxRequestBodyBytes,
    maxResponseBodyBytes: maxResponseBodyBytes
  });
}
