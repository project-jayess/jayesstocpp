# Jayess `jayess:crypto` Module

`jayess:crypto` is a Jayess-owned standard module for a narrow current shipped cryptographic helper surface.

The current shipped surface is deliberately small:

- digest helpers
- HMAC helpers
- one focused KDF helper
- PEM certificate/private-key/trust-anchor container helpers
- streaming hash handles
- random byte generation

It does not yet claim broader transport-security, certificate, key-management, AEAD, public-key, signature, or general KDF APIs.

The module works on `jayess:bytes` values for binary input and output. It does not add ambient Node.js `crypto` globals or support importing `node:crypto`.

```js
import { fromUtf8, secureEquals } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import {
  certificateFromPem,
  createHash,
  digestHash,
  hkdfSha256,
  hmacSha256,
  hmacSha512,
  privateKeyFromPem,
  randomBytes,
  sha1,
  sha256,
  sha512,
  trustAnchorsFromPem,
  updateHash
} from "jayess:crypto";
```

## Exports

- `sha256(bytes)`
- `sha512(bytes)`
- `sha1(bytes)`
- `hmacSha256(key, bytes)`
- `hmacSha512(key, bytes)`
- `hmacSha1(key, bytes)`
- `hkdfSha256(key, salt, info, length)`
- `certificateFromPem(text)`
- `privateKeyFromPem(text)`
- `trustAnchorsFromPem(text)`
- `createHash(algorithm)`
- `updateHash(handle, bytes)`
- `digestHash(handle)`
- `randomBytes(count)`

## Semantics

- `sha256(bytes)` requires bytes and returns the SHA-256 digest as bytes.
- `sha512(bytes)` requires bytes and returns the SHA-512 digest as bytes.
- `sha1(bytes)` requires bytes and returns the SHA-1 digest as bytes. SHA-1 remains shipped only as a legacy compatibility helper and should not be chosen for new security-sensitive uses.
- `hmacSha256(key, bytes)`, `hmacSha512(key, bytes)`, and `hmacSha1(key, bytes)` require byte keys and byte payloads and return digest bytes. `hmacSha1` is legacy-only for the same compatibility reason as `sha1(bytes)`.
- `hkdfSha256(key, salt, info, length)` performs the RFC 5869 extract/expand flow with SHA-256, requires byte inputs plus a non-negative integer output length, treats an empty salt as thirty-two zero bytes, and currently limits output to `8160` bytes.
- `certificateFromPem(text)` expects exactly one PEM `CERTIFICATE` block and returns a Jayess-owned container object with `kind`, `source`, `label`, `pem`, and DER `bytes`.
- `privateKeyFromPem(text)` expects exactly one PEM block whose label ends with `PRIVATE KEY` and returns the same normalized container shape with `kind: "privateKey"`.
- `trustAnchorsFromPem(text)` expects one or more PEM `CERTIFICATE` blocks and returns an array of normalized certificate containers.
- `createHash(algorithm)` creates an explicit streaming hash handle for `"sha256"`, `"sha512"`, or `"sha1"`. `"sha1"` remains legacy-only.
- `updateHash(handle, bytes)` appends bytes to a streaming hash handle and returns the same handle.
- `digestHash(handle)` hashes the accumulated bytes and returns digest bytes.
- `randomBytes(count)` requires a non-negative integer count and returns that many bytes.

The PEM helpers are intentionally narrow:

- they normalize PEM text and base64-decode the embedded DER bytes
- they validate focused block-label expectations
- they do not yet parse ASN.1 certificate fields or private-key metadata
- they do not create TLS sockets, sessions, or transport state

Use `jayess:bytes.secureEquals(left, right)` for digest, MAC, or derived-key comparisons. Use `jayess:bytes.equals(left, right)` for ordinary non-secret byte-content equality, and `jayess:encoding.hexEncode(bytes)` when a text digest representation is needed.

`randomBytes(count)` now uses explicit host CSPRNG sources in the generated runtime:

- Windows: `BCryptGenRandom` through a narrow dynamically loaded `bcrypt.dll` path
- macOS: `arc4random_buf`
- Linux: `/dev/urandom`

Generated C++ output remains deterministic; the produced random bytes are runtime values.

## Legacy And Non-Goals

The current shipped surface keeps SHA-1 only for compatibility where the module already exposed it. The docs and diagnostics should treat it as legacy-only rather than recommending it for new code.

The current shipped surface does not yet claim:

- PBKDFs
- AEAD helpers such as AES-GCM or ChaCha20-Poly1305
- TLS sockets
- public-key primitives
- signature helpers
- keystore APIs beyond the current PEM container helpers

## First Approved TLS-Supporting Direction

Because `jayess:http` now has a real plain-HTTP runtime path on both Unix/POSIX and Windows, the first approved TLS-supporting `jayess:crypto` direction is now explicit: `jayess:crypto` should own certificate, private-key, and trust-anchor container values, while `jayess:http` must continue to own transport sockets, handshakes, ALPN, and HTTPS server/client behavior.

The first approved primitive direction is now shipped:

- `certificateFromPem(text)`
- `privateKeyFromPem(text)`
- `trustAnchorsFromPem(text)`

Those helpers normalize certificate/key/trust material into Jayess-owned values. They do not create sockets, start TLS handshakes, or expose protocol/session state directly.

## Still Out Of Scope

Even after the current modern digest/HMAC/KDF slice, the module still does not yet claim:

- PBKDFs
- AEAD helpers such as AES-GCM or ChaCha20-Poly1305
- live TLS sockets
- public-key primitives
- signature helpers
- keystore APIs beyond the current PEM container/trust-anchor direction above

## Generated Output

The current shipped surface is split across:

- `stdlib/jayess/crypto/index.js`
- `stdlib/jayess/crypto/crypto-primitives.hpp`
- `src/cpp/runtime-crypto-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.

## Related Modules

- [jayess:bytes](./jayess-bytes-module.md)
- [jayess:encoding](./jayess-encoding-module.md)
