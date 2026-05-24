import { close, createServer, deleteThenSendFile, serveFiles } from "jayess:http";
import { join } from "jayess:path";

export function serve(root, port) {
  var staticHandler = serveFiles(root, {
    index: "index.html",
    cacheControl: "max-age=60"
  });
  return createServer(function(requestValue, response) {
    if (requestValue.path === "/volatile") {
      return deleteThenSendFile(response, join(root, "volatile.txt"), null);
    }
    if (requestValue.path === "/unknown.bin") {
      return staticHandler({
        method: requestValue.method,
        path: "/mystery.unknown",
        headers: requestValue.headers,
        body: requestValue.body,
        params: null
      }, response);
    }
    return staticHandler(requestValue, response);
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function stop(server) {
  return close(server);
}
