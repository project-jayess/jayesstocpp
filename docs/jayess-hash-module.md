# `jayess:hash` Module

`jayess:hash` provides higher-level hash helpers layered over existing Jayess byte, crypto, encoding, and filesystem modules.

## Surface

- `sha256Bytes(bytes)` returns a hex SHA-256 digest for bytes.
- `sha1Bytes(bytes)` returns a hex SHA-1 digest for bytes.
- `sha256Text(text)` hashes UTF-8 text and returns hex.
- `sha1Text(text)` hashes UTF-8 text and returns hex.
- `sha256File(path)` reads bytes asynchronously and returns a hex SHA-256 digest.
- `sha1File(path)` reads bytes asynchronously and returns a hex SHA-1 digest.
- `sha256FileSync(path)` reads bytes synchronously and returns a hex SHA-256 digest.
- `sha1FileSync(path)` reads bytes synchronously and returns a hex SHA-1 digest.
- `sha256TextFile(path)` reads text asynchronously and returns a hex SHA-256 digest.
- `sha256TextFileSync(path)` reads text synchronously and returns a hex SHA-256 digest.
- `streamSha256(stream, chunkSize)` consumes a stream asynchronously and returns a hex SHA-256 digest.
- `streamSha1(stream, chunkSize)` consumes a stream asynchronously and returns a hex SHA-1 digest.

`jayess:hash` does not add new cryptographic primitives. Primitive hashing stays in `jayess:crypto`.
