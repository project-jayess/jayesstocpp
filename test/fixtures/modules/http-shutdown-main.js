import { body, close as closeServer, createServer, sendText } from "jayess:http";
import { sleep } from "jayess:timers";

export function serveBodyEcho(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, body(requestValue), { status: 200, contentType: "text/plain" });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function serveSlowEcho(port, milliseconds) {
  return createServer(async function(requestValue, response) {
    await sleep(milliseconds);
    return sendText(response, body(requestValue), { status: 201, contentType: "text/plain" });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function stop(server) {
  return closeServer(server);
}
