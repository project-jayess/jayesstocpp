import { close, createServer, serveFiles } from "jayess:http";

export function serve(root, port) {
  var staticHandler = serveFiles(root, {
    index: "index.html",
    cacheControl: "max-age=60"
  });
  return createServer(function(requestValue, response) {
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
