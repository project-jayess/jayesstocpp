# Jayess Stream Module

`jayess:stream` provides a focused byte-oriented stream surface for file-backed and runtime-provided read/write handles. It is a Jayess-owned module, not a Node.js stream compatibility layer.

## Surface

- `openRead(path)`
- `openWrite(path)`
- `openReadSync(path)`
- `openWriteSync(path)`
- `readChunk(stream, size)`
- `writeChunk(stream, bytes)`
- `close(stream)`
- `pipe(readStream, writeStream, chunkSize)`
- `pipeAll(pairs, chunkSize)`
- `copy(fromPath, toPath, chunkSize)`
- `chunks(stream, chunkSize, maxChunks)`
- `readText(stream, chunkSize, maxChunks)`
- `readAllBytes(stream, chunkSize)`
- `readAllText(stream, chunkSize)`
- `toBytes(stream, chunkSize)`
- `toText(stream, chunkSize)`
- `collectBytes(stream, chunkSize, maxBytes)`
- `collectText(stream, chunkSize, maxBytes)`
- `readLines(stream, chunkSize)`
- `writeText(stream, text)`
- `writeLine(stream, text)`
- `pipeText(readStream, writeStream, chunkSize)`
- `pipeWithCancellation(readStream, writeStream, chunkSize, token)`
- `tee(readStream, leftWriteStream, rightWriteStream, chunkSize)`

Default stream functions return Jayess async handles. Use `await` to consume their results. `openReadSync` and `openWriteSync` return direct stream handles for synchronous setup code.

High-level helpers such as `pipe`, `copy`, `readAllBytes`, `collectText`, `pipeText`, and `tee` are ordinary Jayess wrappers layered over the same explicit stream handles and chunk primitives.

## Behavior

`openRead(path)` opens a binary read stream and resolves to a stream handle.

`openWrite(path)` opens a binary write stream and resolves to a stream handle. Existing file content is replaced.

`openReadSync(path)` and `openWriteSync(path)` open the same handle types directly.

`readChunk(stream, size)` reads up to `size` bytes from a read stream and resolves to a `jayess:bytes` value. End-of-file resolves to an empty bytes value.

`writeChunk(stream, bytes)` writes a `jayess:bytes` value to a write stream and resolves to Jayess null.

`close(stream)` closes the stream and resolves to Jayess null. Closing the same stream more than once rejects the returned async handle.

`pipe(readStream, writeStream, chunkSize)` copies chunks between open stream handles until `readChunk` resolves to empty bytes.

`pipeAll(pairs, chunkSize)` runs deterministic left-to-right pipe stages. Each stage is an object with `read` and `write` stream handles.

`copy(fromPath, toPath, chunkSize)` opens streams, pipes bytes, closes both handles, and resolves to Jayess null.

`chunks(stream, chunkSize, maxChunks)` is a bounded generator-style helper that yields read async handles without introducing async generators.

`readText(stream, chunkSize, maxChunks)` consumes bounded chunks and resolves to text.

`readAllBytes(stream, chunkSize)` consumes a stream until EOF and resolves to a single `jayess:bytes` value.

`readAllText(stream, chunkSize)` consumes a stream until EOF and resolves to UTF-8 text.

`toBytes(stream, chunkSize)` is an alias for consuming a stream into one `jayess:bytes` value.

`toText(stream, chunkSize)` is an alias for consuming a stream into UTF-8 text.

`collectBytes(stream, chunkSize, maxBytes)` consumes a stream until EOF while rejecting if the accumulated byte count would exceed `maxBytes`.

`collectText(stream, chunkSize, maxBytes)` consumes bounded bytes and returns UTF-8 text.

`readLines(stream, chunkSize)` consumes a stream until EOF and resolves to an array split on `\n`.

`writeText(stream, text)` writes UTF-8 text to a write stream.

`writeLine(stream, text)` writes text followed by `\n`.

`pipeText(readStream, writeStream, chunkSize)` reads all text and writes it to the output stream.

`pipeWithCancellation(readStream, writeStream, chunkSize, token)` copies bytes like `pipe`, but wraps read and write operations with a `jayess:async` cancellation token.

`tee(readStream, leftWriteStream, rightWriteStream, chunkSize)` copies input chunks to two output streams.

Invalid stream handles, closed stream handles, and wrong-direction operations fail with focused Jayess runtime diagnostics.

The module intentionally stays narrow:

- no Node.js stream event API
- no implicit text-mode line buffering
- no seek/truncate surface
- no ambient global stream handles

## Implementation Shape

- Jayess wrappers live in `stdlib/jayess/stream/index.js`.
- Native bridge declarations live in `stdlib/jayess/stream/stream-primitives.hpp`.
- Runtime support lives in `src/cpp/runtime-stream-source.js`.
- Stream handles are explicit runtime values with identity-based equality.
- Stream operations use the shared Jayess async scheduler helper before resolving or rejecting their async handles.
- Higher-level helpers stay in `stdlib/jayess/stream/index.js` so fs, net, HTTP, and subprocess modules can share behavior instead of duplicating stream loops.
