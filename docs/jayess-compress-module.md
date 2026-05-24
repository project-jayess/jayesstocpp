# `jayess:compress` Module

`jayess:compress` provides dependency-free byte compression helpers for Jayess-owned `jayess:bytes` values.

## Surface

- `deflate(bytes)`
- `inflate(bytes)`
- `gzip(bytes)`
- `gunzip(bytes)`

All helpers accept and return `jayess:bytes`.

## Format Support

The current shipped surface writes stored DEFLATE blocks. This gives deterministic round trips and gzip-compatible framing without requiring generated projects to link against zlib.

`gzip(bytes)` writes a minimal gzip stream with:

- DEFLATE method
- no optional gzip header fields
- stored DEFLATE blocks
- CRC32 trailer
- uncompressed-size trailer

`gunzip(bytes)` accepts the same minimal gzip shape and validates the CRC32 and uncompressed size.

## Diagnostics

The module raises focused runtime diagnostics for:

- non-bytes arguments
- malformed DEFLATE data
- unsupported compressed DEFLATE block types
- malformed gzip headers
- invalid gzip checksum or size trailers

## Boundaries

This module does not introduce a generated-project zlib dependency. Future compression algorithms can be added behind explicit helpers and generated build metadata if they require external libraries.
