# Jayess HTTPS Transport

`jayess:http` owns HTTPS transport behavior. `jayess:crypto` owns certificate, private-key, and trust-anchor container values.

The current HTTPS slice is a platform-neutral validation and host-adapter layer. It accepts the Jayess-owned TLS option shapes, validates certificate/key/trust material before socket work, records the host-TLS adapter requirement in generated metadata, and reports a normalized unavailable-backend diagnostic until a generated project links or registers a host TLS client implementation.

## Client Shape

HTTPS client requests use the existing `request(options)` helper:

```js
import { request } from "jayess:http";
import { trustAnchorsFromPem } from "jayess:crypto";

var response = await request({
  method: "GET",
  url: "https://example.test/",
  tls: {
    trustAnchors: trustAnchorsFromPem(caPem)
  }
});
```

`trustAnchors` may also appear directly on the request options for the focused first slice. Trust anchors must be an array of certificate containers returned by `jayess:crypto`.

`jayess:crypto` also exposes helper metadata for transport configuration and diagnostics: `findTrustAnchorByFingerprint(...)` for explicit trust-anchor lookup, `certificateValidityAt(...)` for checking parsed certificate validity against a caller-provided ISO timestamp, and `certificateChainMetadata(...)` for deterministic metadata-only chain summaries. These helpers do not perform host trust-store lookup, signature verification, revocation checking, or hostname validation.

`alpnProtocols` is recognized as a TLS transport option but is not supported by the current transport slice. Supplying it reports:

```text
Jayess http TLS ALPN is unsupported in the current transport slice
```

## Server Shape

HTTPS servers use the existing `createServer(handler, options)` helper:

```js
import { createServer } from "jayess:http";
import { certificateFromPem, privateKeyFromPem, trustAnchorsFromPem } from "jayess:crypto";

var server = createServer(handler, {
  host: "127.0.0.1",
  port: 8443,
  tls: {
    certificate: certificateFromPem(certificatePem),
    privateKey: privateKeyFromPem(privateKeyPem),
    trustAnchors: trustAnchorsFromPem(caPem)
  }
});
```

`tls.certificate` must be a certificate container. `tls.privateKey` must be a private-key container. `tls.trustAnchors`, when present, must be an array of certificate containers.

## Current Runtime Behavior

The current generated runtime validates these shapes and routes HTTPS client requests through a narrow host-TLS backend boundary. By default, with no linked host implementation, the backend reports:

```text
Jayess http HTTPS transport backend is not available on this host
```

Plain HTTP remains unchanged and continues to use the existing HTTP/1.1 client and server paths.

Generated metadata for `jayess:http` records the plain HTTP adapters plus the `tls-validation` and `host-tls` adapter families. `tls-validation` is always compiled with the HTTP runtime. `host-tls` is compiled as a client adapter hook on every host; it becomes available when a project registers a host implementation through the generated runtime API. The hook receives method, URL, host, port, path, headers, body, raw request text, timeout, and TLS-option presence, then returns normalized status, headers, and body data.

Server-side TLS still only validates option shapes in this slice. It does not perform a live TLS accept/handshake.

## Boundaries

This slice does not add HTTP/2, WebSocket, browser fetch compatibility, Node.js `https` compatibility, or raw TLS session handles.

Certificate parsing, private-key parsing, certificate metadata, trust-anchor validation, fingerprint lookup, explicit-time validity metadata, and metadata-only chain summaries stay in `jayess:crypto`. Socket setup, handshakes, peer verification, request parsing, response writing, and transport diagnostics stay in `jayess:http`.
