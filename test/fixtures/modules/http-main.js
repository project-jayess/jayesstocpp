import {
  body,
  bodyBytes,
  bodyText,
  bytes,
  collectBody,
  json,
  jsonBody,
  createServer,
  end,
  handle,
  header,
  headers,
  match,
  method,
  notFound,
  params,
  path,
  query,
  request,
  requestWithCancellation,
  requestWithTimeout,
  requestWithTimeoutAndCancellation,
  redirect,
  route,
  router,
  sendBytes,
  sendBytesStream,
  sendJson,
  sendText,
  sendTextStream,
  setHeader,
  setStatus,
  status,
  text,
  textBody,
  write
} from "jayess:http";
import { createCancellationToken } from "jayess:async";
import { length as bytesLength } from "jayess:bytes";
import { certificateFromPem, privateKeyFromPem, trustAnchorsFromPem } from "jayess:crypto";
import { close as closeStream, openRead } from "jayess:stream";

const TEST_CERTIFICATE = "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----";
const TEST_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYWJj\n-----END PRIVATE KEY-----";

export async function fetchText(url) {
  var response = await request({
    method: "GET",
    url: url,
    headers: {
      "Accept": "text/plain"
    }
  });
  return text(response);
}

export async function fetchTextWithCancellation(url) {
  var token = createCancellationToken();
  var response = await requestWithCancellation({
    method: "GET",
    url: url
  }, token);
  return text(response);
}

export async function fetchTextWithTimeout(url) {
  var response = await requestWithTimeout({
    method: "GET",
    url: url
  }, 1000);
  return text(response);
}

export async function fetchTextWithTimeoutAndCancellation(url) {
  var token = createCancellationToken();
  var response = await requestWithTimeoutAndCancellation({
    method: "GET",
    url: url
  }, 1000, token);
  return text(response);
}

export async function fetchJson(url) {
  var response = await request({
    method: "POST",
    url: url,
    headers: {
      "Content-Type": "application/json"
    },
    body: jsonBody({ ok: true })
  });
  return json(response);
}

export async function fetchBytes(url) {
  var response = await request({
    method: "POST",
    url: url,
    body: textBody("payload")
  });
  return bytes(response);
}

export function serveOnce(port) {
  return createServer(function(requestValue, response) {
    setStatus(response, 201);
    setHeader(response, "Content-Type", "text/plain");
    var requestHeaders = headers(requestValue);
    write(response, method(requestValue));
    write(response, " ");
    write(response, path(requestValue));
    write(response, " ");
    write(response, body(requestValue));
    end(response, " ok");
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function serveHelpersOnce(port) {
  return createServer(function(requestValue, response) {
    var params = query(requestValue);
    if (params.kind === "json") {
      return sendJson(response, { ok: true, name: params.name }, { status: 202 });
    }
    if (params.kind === "redirect") {
      return redirect(response, "/next", 302);
    }
    if (params.kind === "bytes") {
      return sendBytes(response, textBody("bytes"), { status: 203, contentType: "text/plain" });
    }
    if (params.kind === "missing") {
      return notFound(response, "missing");
    }
    return sendText(response, "hello " + params.name, { status: 201 });
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function serveRouterOnce(port) {
  var app = router([
    route("GET", "/hello", function(requestValue, response) {
      var params = query(requestValue);
      status(response, 206);
      return sendJson(response, {
        ok: true,
        name: params.name,
        accept: header(requestValue, "Accept")
      }, null);
    }),
    route("GET", "/redirect", function(requestValue, response) {
      return redirect(response, "/next", 302);
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

export function serveStreamOnce(port, filename) {
  return createServer(async function(requestValue, response) {
    var reader = await openRead(filename);
    await sendTextStream(response, reader, { status: 208, contentType: "text/plain" }, 4);
    await closeStream(reader);
    return null;
  }, {
    host: "127.0.0.1",
    port: port,
    backlog: 4
  });
}

export function matchRoute(requestValue) {
  var app = router([
    route("POST", "/submit", function(requestValue, response) {
      return sendText(response, body(requestValue), null);
    })
  ]);
  var matched = match(app, requestValue);
  if (matched === null) {
    return "missing";
  }
  return matched.method + " " + matched.path;
}

export function matchRouteParam(requestValue) {
  var app = router([
    route("GET", "/users/:id", function(requestValue, response) {
      return sendText(response, params(requestValue).id, null);
    })
  ]);
  var matched = match(app, requestValue);
  if (matched === null) {
    return "missing";
  }
  requestValue.params = matched.params;
  return params(requestValue).id;
}

export function bodyHelperResult(requestValue) {
  return [
    bodyText(requestValue, { maxBytes: 16 }),
    bytesLength(bodyBytes(requestValue, { maxBytes: 16 })),
    collectBody(requestValue, null)
  ];
}

export function bodyTooLarge(requestValue) {
  return bodyText(requestValue, { maxBytes: 2 });
}

export async function streamResponseHelpers(response, filename) {
  var textReader = await openRead(filename);
  await sendTextStream(response, textReader, { status: 209 }, 4);
  await closeStream(textReader);
  var bytesReader = await openRead(filename);
  await sendBytesStream(response, bytesReader, null, 4);
  await closeStream(bytesReader);
  return null;
}

export function httpsServerUnavailable(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, "secure", null);
  }, {
    host: "127.0.0.1",
    port: port,
    tls: {
      certificate: certificateFromPem(TEST_CERTIFICATE),
      privateKey: privateKeyFromPem(TEST_PRIVATE_KEY),
      trustAnchors: trustAnchorsFromPem(TEST_CERTIFICATE)
    }
  });
}

export function invalidHttpsServerCertificate(port) {
  return createServer(function(requestValue, response) {
    return sendText(response, "secure", null);
  }, {
    host: "127.0.0.1",
    port: port,
    tls: {
      certificate: privateKeyFromPem(TEST_PRIVATE_KEY),
      privateKey: privateKeyFromPem(TEST_PRIVATE_KEY)
    }
  });
}

export function httpsRequestUnavailable() {
  return request({
    method: "GET",
    url: "https://example.test/",
    tls: {
      trustAnchors: trustAnchorsFromPem(TEST_CERTIFICATE)
    }
  });
}

export function invalidHttpsRequestTrustAnchors() {
  return request({
    method: "GET",
    url: "https://example.test/",
    trustAnchors: [privateKeyFromPem(TEST_PRIVATE_KEY)]
  });
}

export function unsupportedHttpsAlpn() {
  return request({
    method: "GET",
    url: "https://example.test/",
    tls: {
      alpnProtocols: ["h2"]
    }
  });
}
