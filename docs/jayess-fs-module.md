# Jayess Filesystem Module

`jayess:fs` is the Jayess-owned filesystem helper module. It is explicit module surface, not an ambient Node.js built-in.

## Surface

- `exists(path)`
- `readText(path)`
- `readBytes(path)`
- `readJson(path)`
- `createReadStream(path)`
- `createWriteStream(path)`
- `writeText(path, text)`
- `writeBytes(path, bytes)`
- `writeJson(path, value)`
- `appendText(path, text)`
- `copy(fromPath, toPath)`
- `copyRecursive(fromPath, toPath, options)`
- `createDirectories(path)`
- `tempDirectory(prefix)`
- `tempFile(prefix, suffix)`
- `remove(path)`
- `removeRecursive(path, options)`
- `list(path)`
- `walk(path, options)`
- `rename(fromPath, toPath)`
- `stat(path)`

The default functions return Jayess async handles. Use `await` to consume their results.

Default filesystem operations are scheduled onto the Jayess async queue and settle their returned async handles from that scheduler path. The `Sync` suffixed variants keep direct synchronous behavior for code that needs an immediate value.

Synchronous variants are available with `Sync` suffixes:

- `existsSync(path)`
- `readTextSync(path)`
- `readBytesSync(path)`
- `readJsonSync(path)`
- `createReadStreamSync(path)`
- `createWriteStreamSync(path)`
- `writeTextSync(path, text)`
- `writeBytesSync(path, bytes)`
- `writeJsonSync(path, value)`
- `appendTextSync(path, text)`
- `copySync(fromPath, toPath)`
- `copyRecursiveSync(fromPath, toPath, options)`
- `createDirectoriesSync(path)`
- `tempDirectorySync(prefix)`
- `tempFileSync(prefix, suffix)`
- `removeSync(path)`
- `removeRecursiveSync(path, options)`
- `listSync(path)`
- `walkSync(path, options)`
- `renameSync(fromPath, toPath)`
- `statSync(path)`

All paths are strings. `writeText` / `writeTextSync` and `appendText` / `appendTextSync` expect string content. `writeBytes` / `writeBytesSync` expects a `jayess:bytes` value, and `readBytes` / `readBytesSync` returns a `jayess:bytes` value.

`readJson` / `readJsonSync` and `writeJson` / `writeJsonSync` are convenience helpers layered over text file operations and [jayess:json](./jayess-json-module.md).

Archive file helpers in [jayess:archive](./jayess-archive-module.md) layer their default async `readTar(path)` and `writeTar(path, entries)` functions over `readBytes(path)` and `writeBytes(path, bytes)`. Directory archive helpers use `walk`, `createDirectories`, `readBytes`, and `writeBytes` with matching `Sync` variants for synchronous flows.

File operation failures are reported by the runtime helper instead of silently producing broken generated C++ behavior.

## Binary Helpers

- `readBytes(path)` reads a file in binary mode and resolves to bytes.
- `readBytesSync(path)` reads a file in binary mode and returns bytes directly.
- `writeBytes(path, bytes)` writes bytes to a file in binary mode, replacing existing content, and resolves to Jayess null.
- `writeBytesSync(path, bytes)` writes bytes to a file in binary mode and returns Jayess null directly.
- `copy(fromPath, toPath)` copies one file to another path and replaces an existing target file, then resolves to Jayess null.
- `copySync(fromPath, toPath)` performs the same copy synchronously.
- `copyRecursive(fromPath, toPath, options)` copies a directory tree and resolves to Jayess null.
- `copyRecursiveSync(fromPath, toPath, options)` performs the same recursive copy synchronously.
- `removeRecursive(path, options)` removes a file or directory tree and resolves to the removed-entry count.
- `removeRecursiveSync(path, options)` performs the same recursive remove synchronously.
- `walk(path, options)` resolves to sorted plain entry objects from a recursive directory walk.
- `walkSync(path, options)` performs the same directory walk synchronously.
- `createReadStream(path)` and `createWriteStream(path)` return Jayess async handles for `jayess:stream` file stream handles.
- `createReadStreamSync(path)` and `createWriteStreamSync(path)` return `jayess:stream` file stream handles directly.

Binary payloads use the explicit [jayess:bytes](./jayess-bytes-module.md) module rather than strings.

## Recursive Tree Helpers

Recursive tree helpers validate the tree path before touching the host filesystem:

- empty paths are rejected
- paths containing `..` traversal segments are rejected
- recursive copy targets inside the source tree are rejected
- option arguments must be objects
- the first shipped option shape accepts no keys; unknown keys fail with focused diagnostics

`walk(path, options)` and `walkSync(path, options)` return a deterministic array sorted by `relativePath`. Each item is a plain object:

- `path`: the full entry path as a normalized string
- `relativePath`: the entry path relative to the walk root
- `type`: `file`, `directory`, or `other`

The async helpers use the same runtime behavior as their `Sync` variants and settle through the Jayess async scheduler.

## Text Append

`appendText(path, text)` opens the target file in append mode, writes string content after existing file content, and resolves to Jayess null. `appendTextSync(path, text)` performs the same operation synchronously.

## Temporary Paths

`tempDirectory(prefix)` and `tempDirectorySync(prefix)` create a directory under the host temporary directory using the provided prefix plus a UUID suffix.

`tempFile(prefix, suffix)` and `tempFileSync(prefix, suffix)` create an empty file under the host temporary directory using the provided prefix, a UUID suffix, and the requested file suffix.

The helpers throw focused Jayess errors for empty prefixes and null file suffixes.

## Implementation Shape

- Jayess wrappers live in `stdlib/jayess/fs/index.js`.
- Native bridge declarations live in `stdlib/jayess/fs/fs-primitives.hpp`.
- Runtime support lives in `src/cpp/runtime-fs-source.js`.
- Default async operations use the shared Jayess async scheduler helper before resolving or rejecting their async handle.

`transpile()` string mode does not resolve `jayess:fs` by default. Use `transpileFile()` so the closed module graph can include the standard module.
