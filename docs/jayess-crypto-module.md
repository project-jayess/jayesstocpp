# Jayess `jayess:crypto` Module

`jayess:crypto` is a Jayess-owned standard module for a narrow current shipped cryptographic helper surface.

The current shipped surface is deliberately small:

- digest helpers
- HMAC helpers
- one focused KDF helper
- PEM certificate/private-key/trust-anchor container helpers
- certificate fingerprint and verification metadata helpers
- certificate trust-anchor lookup, explicit-time validity metadata, and metadata-only chain summaries
- streaming hash handles
- random byte generation

It does not yet claim broader transport-security, certificate, key-management, AEAD, public-key, signature, or general KDF APIs.

The module works on `jayess:bytes` values for binary input and output. It does not add ambient Node.js `crypto` globals or support importing `node:crypto`.

```js
import { fromUtf8, secureEquals } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import {
  certificateFromPem,
  certificateFingerprint,
  certificateChainMetadata,
  certificateMetadata,
  certificateValidityAt,
  createHash,
  certificateVerificationMetadata,
  digestHash,
  findTrustAnchorByFingerprint,
  hkdfSha256,
  hmacSha256,
  hmacSha512,
  privateKeyFromPem,
  privateKeyMetadata,
  randomBytes,
  sha1,
  sha256,
  sha512,
  trustAnchorsFromPem,
  validateTrustAnchors,
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
- `certificateFingerprint(certificate, algorithm)`
- `certificateVerificationMetadata(certificate, algorithm)`
- `findTrustAnchorByFingerprint(anchors, fingerprint, algorithm)`
- `certificateValidityAt(certificate, timestamp)`
- `certificateChainMetadata(certificates, algorithm)`
- `certificateMetadata(certificate)`
- `certificateSubject(certificate)`
- `certificateIssuer(certificate)`
- `certificateSerialNumber(certificate)`
- `certificateValidityStart(certificate)`
- `certificateValidityEnd(certificate)`
- `privateKeyFromPem(text)`
- `privateKeyMetadata(privateKey)`
- `privateKeyKind(privateKey)`
- `privateKeyEncodedLength(privateKey)`
- `trustAnchorsFromPem(text)`
- `validateTrustAnchors(anchors)`
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
- `certificateFingerprint(certificate, algorithm)` validates a normalized certificate container and returns a lowercase hex fingerprint for `"sha256"`, `"sha512"`, or legacy-only `"sha1"`.
- `certificateVerificationMetadata(certificate, algorithm)` returns deterministic verification-facing metadata: container kind/source/label, selected algorithm, fingerprint, subject, issuer, serial number, and validity fields.
- `findTrustAnchorByFingerprint(anchors, fingerprint, algorithm)` validates an explicit trust-anchor array and returns the matching certificate container or `null`.
- `certificateValidityAt(certificate, timestamp)` checks a certificate's parsed validity window against an explicit ISO timestamp string and returns `{ valid, reason, checkedAt, validityStart, validityEnd }`.
- `certificateChainMetadata(certificates, algorithm)` returns a deterministic metadata-only chain summary with certificate fingerprints and parsed names. It deliberately sets `verified: false` and `verification: "metadata-only"` because this helper does not perform signature, issuer, host-name, revocation, or public-key path validation.
- `certificateMetadata(certificate)` returns `{ subject, issuer, serialNumber, validityStart, validityEnd }`. The parser handles a focused DER/X.509 subset and returns `null` fields when the bytes are a valid container but outside the deterministic subset.
- `certificateSubject`, `certificateIssuer`, `certificateSerialNumber`, `certificateValidityStart`, and `certificateValidityEnd` return individual fields from `certificateMetadata(certificate)`.
- `privateKeyFromPem(text)` expects exactly one PEM block whose label ends with `PRIVATE KEY` and returns the same normalized container shape with `kind: "privateKey"`.
- `privateKeyMetadata(privateKey)` returns `{ kind, encodedLength }`, where `kind` is `pkcs8`, `rsa`, or `ec` based on the PEM label and `encodedLength` is the DER byte length.
- `privateKeyKind(privateKey)` and `privateKeyEncodedLength(privateKey)` return individual private-key metadata fields without exposing host key handles.
- `trustAnchorsFromPem(text)` expects one or more PEM `CERTIFICATE` blocks and returns an array of normalized certificate containers.
- `validateTrustAnchors(anchors)` requires an array containing only normalized certificate containers and returns the same array.
- `createHash(algorithm)` creates an explicit streaming hash handle for `"sha256"`, `"sha512"`, or `"sha1"`. `"sha1"` remains legacy-only.
- `updateHash(handle, bytes)` appends bytes to a streaming hash handle and returns the same handle.
- `digestHash(handle)` hashes the accumulated bytes and returns digest bytes.
- `randomBytes(count)` requires a non-negative integer count and returns that many bytes.

The PEM helpers are intentionally narrow:

- they normalize PEM text and base64-decode the embedded DER bytes
- they validate focused block-label expectations
- they parse only a focused deterministic DER/X.509 metadata subset for certificate names, serials, and validity times
- they expose private-key label metadata and DER length, not host key handles
- they expose certificate fingerprints and verification metadata for transport/helper layers without creating host trust stores
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

Because `jayess:http` now has a real plain-HTTP runtime path on both Unix/POSIX and Windows, the first approved TLS-supporting `jayess:crypto` direction is now explicit: `jayess:crypto` owns certificate, private-key, and trust-anchor container values, while `jayess:http` owns transport sockets, handshakes, ALPN, and HTTPS server/client behavior.

The first approved primitive direction is now shipped:

- `certificateFromPem(text)`
- `privateKeyFromPem(text)`
- `trustAnchorsFromPem(text)`
- certificate metadata helpers
- certificate fingerprint and verification metadata helpers
- private-key metadata helpers
- trust-anchor validation helpers

Those helpers normalize certificate/key/trust material into Jayess-owned values. They do not create sockets, start TLS handshakes, or expose protocol/session state directly. The current `jayess:http` HTTPS boundary validates these containers before reporting its normalized unavailable-backend diagnostic.

## Still Out Of Scope

Even after the current modern digest/HMAC/KDF slice, the module still does not yet claim:

- PBKDFs
- AEAD helpers such as AES-GCM or ChaCha20-Poly1305
- live TLS sockets
- public-key primitives
- signature helpers
- keystore APIs beyond the current PEM container/trust-anchor direction above
- TLS transport behavior, which belongs in `jayess:http` or a later transport module

## Generated Output

The current shipped surface is split across:

- `stdlib/jayess/crypto/index.js`
- `stdlib/jayess/crypto/crypto-primitives.hpp`
- `src/cpp/runtime-crypto-source.js`
- `stdlib/jayess/crypto/certificate-fingerprint.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.

## Related Modules

- [jayess:bytes](./jayess-bytes-module.md)
- [jayess:encoding](./jayess-encoding-module.md)
