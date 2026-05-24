import { createServer, handle, route, router, sendFile, sendJson } from "jayess:http";

export function serve(port, staticPath) {
  var routes = router([
    route("GET", "/data", function (request, response) {
      return sendJson(response, { name: "Jayess", kind: "workflow" }, { status: 200 });
    }),
    route("GET", "/asset", function (request, response) {
      return sendFile(response, staticPath, { status: 200, contentType: "text/plain" });
    })
  ]);
  return createServer(function (request, response) {
    return handle(routes, request, response);
  }, { host: "127.0.0.1", port: port, backlog: 4 });
}
