import {
  close,
  compose,
  createServer,
  end,
  handle,
  path,
  params,
  route,
  router,
  sendText
} from "jayess:http";

export function serveMulti(port) {
  var state = { count: 0 };
  return createServer(function(requestValue, response) {
    state.count = state.count + 1;
    return end(response, "request " + state.count);
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function stop(server) {
  return close(server);
}

export function composeResult() {
  var combined = compose([
    function(requestValue, response) {
      return null;
    },
    function(requestValue, response) {
      return "composed";
    }
  ]);
  return combined({}, null);
}

export function serveParams(port) {
  var app = router([
    route("GET", "/users/:id", function(requestValue, response) {
      return sendText(response, params(requestValue).id, { status: 207 });
    })
  ]);

  return createServer(function(requestValue, response) {
    return handle(app, requestValue, response);
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function serveEchoPath(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, path(requestValue), { status: 208 });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}
