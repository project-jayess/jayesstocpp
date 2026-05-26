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
- `method(request)`, `path(request)`, `url(request)`, `pathname(request)`, `headers(request)`, `header(request, name)`, and `body(request)` read fields from server request objects.
- `bodyText(request, options)`, `bodyBytes(request, options)`, and `collectBody(request, options)` read the runtime-owned server body with optional `maxBytes` checks.
- `query(request)` parses the request path query string as a Jayess object.
- `queryParam(request, name)` returns one parsed query value or `null`.
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
- `sendTextStream(response, stream, options, chunkSize)` consumes a Jayess read stream and sends a real chunked text response incrementally.
- `sendBytesStream(response, stream, options, chunkSize)` consumes a Jayess read stream and sends a real chunked byte response incrementally.
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

## Current Shipped Scope

The current shipped scope supports plain HTTP over the Jayess-owned native runtime adapter:

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

The current shipped data path is plain HTTP plus an explicit HTTPS backend boundary:

- plain client URLs use `http://...`
- HTTPS client URLs use `https://...`, validate TLS options, and route through the `host-tls` backend hook before reporting the normalized unavailable-backend diagnostic when no adapter is registered
- HTTPS server options validate `tls.certificate`, `tls.privateKey`, and optional `tls.trustAnchors` before reporting the normalized unavailable-backend diagnostic
- `tls.alpnProtocols` and request `alpnProtocols` are recognized as unsupported ALPN options and report a focused diagnostic
- live client TLS is provided through the host adapter hook; server TLS, host trust-store integration, ALPN negotiation, and HTTP/2 remain out of scope

`jayess:crypto` owns certificate/key/trust-anchor container and metadata primitives. `jayess:http` owns transport sockets, handshakes, ALPN, and request/response behavior. See [jayess-https-transport.md](./jayess-https-transport.md).

This is not Node.js `http` compatibility and does not expose Node streams. The server surface is intentionally handle-based and explicit so the runtime can grow without changing the import surface.

## Current Host Boundary

The current runtime boundary is now a plain-HTTP socket path on both major host families already used elsewhere in the repo:

- client request helpers use the focused native HTTP runtime path
- server creation, request handling, response sending, and `close(server)` now have both Unix/POSIX and Windows/Winsock-backed implementations
- the current Windows slice is still the same bounded HTTP/1.1 close-per-connection server path as the Unix slice; TLS option validation is platform-neutral, and HTTPS client requests now pass through a named `host-tls` backend hook before reporting the normalized unavailable-backend diagnostic if no hook is registered

This means `jayess:http` now has a first real Windows server/runtime path and a platform-neutral HTTPS validation boundary.

## Current Production-Level Boundary

For the current shipped slice, "production level" means the module has deliberate contracts and diagnostics for the plain-HTTP surface it already claims:

- explicit request, response, route, and static-file helper APIs rather than ambient Node.js behavior
- explicit invalid-input diagnostics instead of silent coercion
- deterministic body helper limits through `maxBytes` where those helpers already expose it
- explicit platform-bounded behavior instead of pretending missing transport features exist

It does not yet mean that the module has fully hardened transport behavior. The following remain outside the current production claim until later slices land:

- live TLS handshakes and certificate verification
- live host trust-store integration for transport
- HTTP/2, HTTP/3, or WebSocket behavior
- fully incremental streaming across every request and response helper shape
- server hardening items such as graceful shutdown guarantees

## Current Request-Parsing Limits

The shipped server runtime now enforces explicit request-head limits before user handlers run:

- request line: 4096 bytes
- total request-head bytes before the blank line: 16384 bytes
- header count: 100 headers

Malformed request lines, malformed headers, invalid `Content-Length` values, and incomplete request heads are rejected by the runtime before the handler is invoked.

The current rejection behavior is:

- malformed request line or malformed headers: `400`
- oversized header count or header block: `431`

These are runtime guardrails for the server parser. They do not yet imply the later graceful-shutdown slice is complete.

## Current Timeout Policy

The shipped server runtime now applies one explicit read-timeout policy to accepted client sockets:

- idle accepted socket before a full request head arrives: `5000ms`
- partially received request head: `5000ms` per blocking read while the head is still incomplete
- partially received request body after `Content-Length` is known: `5000ms` per blocking read while the body is still incomplete

The current timeout response is:

- read timeout during request head: `408`
- read timeout during request body: `408`

This policy is currently runtime-owned and fixed. It is not yet configurable through `createServer(options)`, and it does not yet imply the later graceful-shutdown slice is complete.

## Current Graceful Shutdown Policy

The shipped server runtime now applies one explicit shutdown policy for `close(server)`:

- stop accepting new connections immediately
- wait for active requests to finish for up to `1000ms`
- if active requests are still running after that grace window, force-close their client sockets
- once active requests drain or the forced close completes, return from `close(server)`

This means short in-flight requests can still complete during shutdown, while long-running requests do not block shutdown indefinitely.

The current graceful-shutdown policy is runtime-owned and fixed. It does not yet imply broader lifecycle features such as persistent keep-alive draining or richer server-state inspection APIs.

## Current Connection Policy

The shipped server runtime now has one explicit connection policy:

- the server is close-per-connection
- every normal response writes `Connection: close`
- the runtime closes the client socket immediately after the response is sent
- if a handler returns without calling `end(...)`, the runtime still completes the response with the current buffered body and closes the connection

Persistent keep-alive connections are not supported in the current slice.

The current pipelining behavior is also explicit:

- multiple requests queued on one connection are rejected
- the runtime returns `400` with `Jayess http pipelined requests are not supported`

This keeps the current HTTP/1.1 server path honest while later graceful-shutdown work remains separate.

## Current Body-Size Guardrails

The shipped server runtime now applies buffered body-size guardrails on both sides of the handler boundary:

- default max request body size: `1048576` bytes
- default max buffered response body size: `1048576` bytes

These can be overridden per server through `createServer(handler, options)`:

- `maxHeaderBytes`
- `maxBodyBytes` as the short request-body guardrail name
- `maxRequestBodyBytes`
- `maxResponseBodyBytes`

The current rejection behavior is:

- request headers larger than `maxHeaderBytes`: `431`
- request body larger than `maxRequestBodyBytes`: `413`
- buffered response body larger than `maxResponseBodyBytes`: `500`

The request-body limit is enforced by the runtime before the handler sees the full request object. The response-body limit is enforced on both shipped response paths:

- the buffered `write(...)` / `end(...)` path used by `sendText`, `sendJson`, and `sendBytes`
- the chunked streaming path used by `sendTextStream(...)` and `sendBytesStream(...)`, which counts total streamed bytes before each emitted chunk

These guardrails do not yet imply the later streaming slice is complete.

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
- `maxHeaderBytes`
- `maxBodyBytes`
- `maxRequestBodyBytes`
- `maxResponseBodyBytes`
- `idleTimeoutMillis`
- `headerTimeoutMillis`
- `bodyTimeoutMillis`

Server guardrail options must be positive integers. Unsupported option keys fail before the server socket is opened.

`state(server)` returns a small server-state object for lifecycle verification:

- `closed`
- `acceptLoopExited`
- `activeClients`

The response object returned by `request(options)` should include:

- `statusCode`
- `headers`
- `body`

Use `text(response)`, `bytes(response)`, or `json(response)` instead of depending on response object field layout in user code.

The server request object supports:

- `method(request)`
- `path(request)`
- `query(request)`
- `url(request)`
- `pathname(request)`
- `queryParam(request, name)`
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

## Request Helpers

`url(request)` returns the request path value exactly as provided by the runtime request object. For server requests this is the path plus query string, such as `/users/42?tab=profile`.

`pathname(request)` strips the query string and returns only the route/static-file pathname.

`queryParam(request, name)` parses the query string through `jayess:querystring` and returns the named value or `null` when it is not present. It is a convenience helper over `query(request)` and does not change routing behavior.

## Response Helpers

The response helpers layer over `setStatus`, `setHeader`, and `end`.

Options are plain Jayess objects:

- `status` sets the HTTP status code.
- `headers` sets response headers from object fields.
- `contentType` sets `Content-Type`.

`sendFile` reads the file synchronously through `jayess:fs` and uses `jayess:mime` when `contentType` is not provided.

`sendTextStream` and `sendBytesStream` are async Jayess helper functions layered over `jayess:stream.readChunk(...)`. They begin a chunked HTTP response, read one stream chunk at a time, write each chunk incrementally, and end the response explicitly when the stream reaches EOF.

## Static Files

`serveStatic(root, options)` returns a handler function that can be used directly in `createServer` or composed with routing helpers.

Supported options:

- `index`: index filename for directory requests. Defaults to `index.html`; an empty string disables index file lookup.
- `cacheControl`: optional `Cache-Control` header value for served files. `null` or absence omits the header.

The helper normalizes request pathnames before filesystem access, rejects `..` and backslash path segments, serves files with MIME lookup, applies optional deterministic cache headers, returns `404` for missing paths, and returns `400` for unsafe paths.

The current static-file hardening rules are explicit:

- path traversal through `..` path segments is rejected
- percent-encoded traversal markers such as `%2e`, `%2f`, and `%5c` are rejected before filesystem access
- unknown file extensions fall back to `application/octet-stream`
- if a file disappears between path validation and the actual read, the helper returns `404` instead of surfacing the raw host exception
- if a file still exists but the read itself fails, the helper returns `500` with a focused `file read failed` response

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

`jayess:http` also exports a small signed-session cookie layer:

- `signSession(value, secret)` returns `value.signature`, using HMAC-SHA-256 over the value.
- `verifySession(signedValue, secret)` returns the unsigned value or `null`.
- `getSignedCookie(request, name, secret)` reads a Cookie value through `jayess:cookie` and verifies it.
- `setSignedCookie(response, name, value, secret, options)` signs a value and writes it through `jayess:cookie`.

Signed session values and secrets must be non-empty strings, and values cannot contain dots or semicolons. This keeps the shipped helper deterministic and reviewable; it is not a middleware framework or encrypted session store.

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

Current host-boundary diagnostics also include:

- `Jayess http request supports only http:// and https:// URLs` for unsupported URL schemes
- `Jayess http HTTPS transport backend is not available on this host` after valid HTTPS/TLS client or server option shapes reach a runtime without a live TLS host adapter
- `Jayess http TLS ALPN is unsupported in the current transport slice` for request or TLS options that provide ALPN protocol selection
- `Jayess http TLS handshake failed: ...` for a compiled host-TLS adapter that starts but cannot complete a handshake
- `Jayess http TLS certificate verification failed: ...` for a compiled host-TLS adapter that rejects peer certificate verification

## Implementation

- Jayess wrappers live in `stdlib/jayess/http/index.js`.
- Native bridge declarations live in `stdlib/jayess/http/http-primitives.hpp`.
- Portable C++ runtime helpers live in `src/cpp/runtime-http-source.js`.
- HTTP client URL parsing and request formatting helpers live in `src/cpp/runtime-http-client-source.js`.
- HTTPS/TLS option validation helpers live in `src/cpp/runtime-http-tls-source.js`.
- The host-TLS adapter boundary lives in `src/cpp/runtime-http-tls-backend-source.js`.
- The module keeps request/response objects explicit and avoids Node.js stream compatibility.
- HTTP helpers use `jayess:bytes` for binary bodies and strings for text bodies.
- Stream response helpers reuse `jayess:stream` instead of adding Node.js stream compatibility.
- Query parsing uses `jayess:querystring`.
- Static file content type lookup uses `jayess:mime`.

## Current Non-Goals

The current shipped module does not yet claim:

- live TLS handshakes and certificate verification
- host trust-store integration for transport
- HTTP/2 or HTTP/3
- WebSocket support
- fully incremental body streaming semantics in every helper

Executable runtime verification currently splits host coverage deliberately:

- Windows and Unix/POSIX both run the core request/response, malformed-request, oversized-header, timeout, body-limit, streaming, connection-policy, and static-file probes.
- Focused graceful-shutdown and concurrent-request lifecycle probes currently run on Unix-like hosts, while the broader Windows/Winsock lifecycle parity is covered by the other executable HTTP probes listed above.
