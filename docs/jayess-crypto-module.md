# Jayess `jayess:crypto` Module

`jayess:crypto` is a Jayess-owned standard module for first-slice cryptographic helpers.

The module works on `jayess:bytes` values for binary input and output. It does not add ambient Node.js `crypto` globals or support importing `node:crypto`.

```js
import { fromUtf8, equals } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import { createHash, digestHash, hmacSha256, randomBytes, sha1, sha256, updateHash } from "jayess:crypto";
```

## Exports

- `sha256(bytes)`
- `sha1(bytes)`
- `hmacSha256(key, bytes)`
- `hmacSha1(key, bytes)`
- `createHash(algorithm)`
- `updateHash(handle, bytes)`
- `digestHash(handle)`
- `randomBytes(count)`

## Semantics

- `sha256(bytes)` requires bytes and returns the SHA-256 digest as bytes.
- `sha1(bytes)` requires bytes and returns the SHA-1 digest as bytes.
- `hmacSha256(key, bytes)` and `hmacSha1(key, bytes)` require byte keys and byte payloads and return digest bytes.
- `createHash(algorithm)` creates an explicit streaming hash handle for `"sha256"` or `"sha1"`.
- `updateHash(handle, bytes)` appends bytes to a streaming hash handle and returns the same handle.
- `digestHash(handle)` hashes the accumulated bytes and returns digest bytes.
- `randomBytes(count)` requires a non-negative integer count and returns that many bytes.

Use `jayess:bytes.equals(left, right)` for digest byte-content equality. Use `jayess:encoding.hexEncode(bytes)` when a text digest representation is needed.

`randomBytes(count)` uses a portable C++ runtime random source. Generated C++ output remains deterministic; the produced random bytes are runtime values.

## Generated Output

The first crypto slice is split across:

- `stdlib/jayess/crypto/index.js`
- `stdlib/jayess/crypto/crypto-primitives.hpp`
- `src/cpp/runtime-crypto-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.

## Related Modules

- [jayess:bytes](./jayess-bytes-module.md)
- [jayess:encoding](./jayess-encoding-module.md)
