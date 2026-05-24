# `jayess:archive` Module

`jayess:archive` provides focused archive helpers for dependency-free tar files.

## Surface

- `createTar(entries)`
- `extractTar(bytes)`
- `writeTar(path, entries)`
- `writeTarSync(path, entries)`
- `readTar(path)`
- `readTarSync(path)`

`createTar(entries)` returns `jayess:bytes`. `extractTar(bytes)` returns deterministic entry objects with `path`, `mode`, `size`, `bytes`, and `text`.

Entries are plain objects:

```js
{ path: "docs/readme.txt", text: "hello", mode: 420 }
{ path: "bin/data.bin", bytes: someBytes, mode: 384 }
```

The current shipped surface supports regular file entries only. Entry paths must be relative, must not contain `..`, and must not contain backslashes. Compression is intentionally not part of this module surface.
