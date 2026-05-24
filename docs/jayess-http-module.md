# Jayess `jayess:http` Module

`jayess:http` is the Jayess-owned HTTP helper module layered over explicit networking primitives. It is not ambient Node.js `http` compatibility.

## Surface

- `request(options)` sends a client HTTP request and returns a Jayess async handle that resolves to a response object.
- `requestWithCancellation(options, token)` sends a client HTTP request and rejects if cancellation wins first.
- `requestWithTimeout(options, milliseconds)` composes a client HTTP request with a Jayess async timeout.
- `requestWithTimeoutAndCancellation(options, milliseconds, token)` composes a client HTTP request with both timeout and cancellation.
- `text(response)` returns the response body as text.
- `bytes(response)` returns the response body as `jayess:bytes`.
- `json(response)` parses the response body as JSON.
- `textBody(value)` returns an explicit text request body.
- `bytesBody(value)` returns an explicit bytes request body.
- `jsonBody(value)` stringifies an explicit JSON request body.
- `method(request)`, `path(request)`, `headers(request)`, `header(request, name)`, and `body(request)` read fields from server request objects.
- `bodyText(request, options)`, `bodyBytes(request, options)`, and `collectBody(request, options)` read the runtime-owned server body with optional `maxBytes` checks.
- `query(request)` parses the request path query string as a Jayess object.
- `params(request)` returns route parameters attached by `handle(router, request, response)`.
- `createServer(handler, options)` starts an HTTP server and returns a server handle. `handler(request, response)` receives explicit request and response objects and may return a Jayess async handle.
- `close(server)` closes a server handle.
- `setStatus(response, statusCode)` sets the response status.
- `status(response, statusCode)` validates and sets the response status.
- `setHeader(response, name, value)` sets one response header.
- `write(response, body)` writes a string or `jayess:bytes` response chunk.
- `end(response, body)` writes an optional final body and completes the response.
- `sendText(response, text, options)` sends a complete text response.
- `sendJson(response, value, options)` sends a complete JSON response.
- `sendBytes(response, bytes, options)` sends a complete byte response.
- `sendTextStream(response, stream, options, chunkSize)` consumes a Jayess stream and sends the text content.
- `sendBytesStream(response, stream, options, chunkSize)` consumes a Jayess stream and sends the byte content.
- `notFound(response, message)` sends a 404 text response.
- `redirect(response, location, status)` sends a redirect response.
- `sendFile(response, filename, options)` sends a file as a byte response with MIME lookup.
- `serveStatic(root, options)` creates a static-directory handler.
- `serveFiles(root, options)` is the higher-level static-directory alias for `serveStatic`.
- `route(method, path, handler)` creates a route descriptor.
- `router(routes)` creates a deterministic route table.
- `match(router, request)` returns the first matching route descriptor or `null`.
- `handle(router, request, response)` dispatches to a matched route handler or sends a 404 response.
- `compose(handlers)` creates a compact sequential handler composition helper.

## First Slice

The implemented first slice supports plain HTTP over the Jayess-owned native runtime adapter:

- `request(options)` for `http://host:port/path` URLs
- `createServer(handler, options)` for a focused multi-request server adapter
- `close(server)` for explicit server lifecycle cleanup
- explicit response handles passed to `handler(request, response)`
- async server handlers are awaited by the runtime before the response fallback is sent
- explicit server request helper functions for request metadata and body access
- focused server body helpers with explicit size diagnostics
- string or `jayess:bytes` request and response bodies
- response body conversion helpers for text, bytes, and JSON
- Jayess async handles for client requests
- Jayess async timeout/cancellation wrappers for client requests

This is not Node.js `http` compatibility and does not expose Node streams. The server first slice is intentionally handle-based and explicit so the runtime can grow without changing the import surface.

## Request Options

- `method`
- `url`
- `headers`
- `body`
- `timeoutMillis`

## Server Options

- `host`
- `port`
- `backlog`

The response object returned by `request(options)` should include:

- `statusCode`
- `headers`
- `body`

Use `text(response)`, `bytes(response)`, or `json(response)` instead of depending on response object field layout in user code.

The server request object supports:

- `method(request)`
- `path(request)`
- `query(request)`
- `params(request)`
- `headers(request)`
- `header(request, name)`
- `body(request)`
- `bodyText(request, options)`
- `bodyBytes(request, options)`
- `collectBody(request, options)`

Request body helper functions keep request construction explicit:

- `textBody(text)`
- `bytesBody(bytes)`
- `jsonBody(value)`

## Response Helpers

The response helpers layer over `setStatus`, `setHeader`, and `end`.

Options are plain Jayess objects:

- `status` sets the HTTP status code.
- `headers` sets response headers from object fields.
- `contentType` sets `Content-Type`.

`sendFile` reads the file synchronously through `jayess:fs` and uses `jayess:mime` when `contentType` is not provided.

`sendTextStream` and `sendBytesStream` are async Jayess helper functions layered over `jayess:stream`. They consume an existing stream handle before completing the response.

## Static Files

`serveStatic(root, options)` returns a handler function that can be used directly in `createServer` or composed with routing helpers.

Supported options:

- `index`: index filename for directory requests. Defaults to `index.html`; an empty string disables index file lookup.
- `cacheControl`: optional `Cache-Control` header value for served files. `null` or absence omits the header.

The helper normalizes request pathnames before filesystem access, rejects `..` and backslash path segments, serves files with MIME lookup, applies optional deterministic cache headers, returns `404` for missing paths, and returns `400` for unsafe paths.

## Routing Helpers

Routing helpers are Jayess-written wrappers over explicit request and response helpers. They do not introduce Node.js framework compatibility.

Route matching compares the pathname only, so `/users/42?include=true` can match `/users/:id`. Captured route parameters are available through `params(request)` inside handlers dispatched through `handle`.

```js
import { createServer, handle, params, route, router, sendJson } from "jayess:http";

var app = router([
  route("GET", "/users/:id", function (request, response) {
    return sendJson(response, { id: params(request).id }, { status: 200 });
  })
]);

export function serve(port) {
  return createServer(function (request, response) {
    return handle(app, request, response);
  }, { host: "127.0.0.1", port: port });
}
```

## Cookie Helpers

Use `jayess:cookie` for focused Cookie parsing and `Set-Cookie` formatting. It layers over `jayess:http` request header and response header helpers without adding Node.js middleware compatibility.

## Diagnostics

The module should throw Jayess runtime errors for:

- invalid request options
- unsupported URL schemes
- invalid status codes
- invalid route methods, paths, handlers, and route arrays
- invalid header names or values
- invalid static roots and static options
- invalid server, request, or response handles
- operations on closed server handles
- response objects that do not contain a string body
- request objects that do not contain method, path, headers, or body fields
- body values that are neither strings nor `jayess:bytes`
- request body `maxBytes` overflow
- invalid file paths used by `sendFile`
- unsafe static file request paths

## Implementation

- Jayess wrappers live in `stdlib/jayess/http/index.js`.
- Native bridge declarations live in `stdlib/jayess/http/http-primitives.hpp`.
- Portable C++ runtime helpers live in `src/cpp/runtime-http-source.js`.
- The module keeps request/response objects explicit and avoids Node.js stream compatibility.
- HTTP helpers use `jayess:bytes` for binary bodies and strings for text bodies.
- Stream response helpers reuse `jayess:stream` instead of adding Node.js stream compatibility.
- Query parsing uses `jayess:querystring`.
- Static file content type lookup uses `jayess:mime`.
