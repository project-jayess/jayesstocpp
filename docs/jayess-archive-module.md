# `jayess:archive` Module

`jayess:archive` provides focused archive helpers for dependency-free tar files.

## Surface

- `createTar(entries)`
- `extractTar(bytes)`
- `createTarFromDirectory(root, options = null)`
- `createTarFromDirectorySync(root, options = null)`
- `extractTarToDirectory(bytes, targetDir, options = null)`
- `extractTarToDirectorySync(bytes, targetDir, options = null)`
- `writeTar(path, entries)`
- `writeTarSync(path, entries)`
- `readTar(path)`
- `readTarSync(path)`

`createTar(entries)` returns `jayess:bytes`. `extractTar(bytes)` returns deterministic entry objects with `path`, `mode`, `size`, `bytes`, and `text`.
Extracted entries also include `type` (`"file"` or `"directory"`) and `mtime` when the tar metadata provides it.

Entries are plain objects:

```js
{ path: "docs/readme.txt", text: "hello", mode: 420, mtime: 0 }
{ path: "bin/data.bin", bytes: someBytes, mode: 384, mtime: 0 }
{ path: "empty", type: "directory", mode: 493, mtime: 0 }
```

The current shipped tar surface supports regular file and directory entries. Entry paths must be relative, must not be Windows-drive absolute, must not contain `..`, `.`, empty path segments, or backslashes, and must be unique after deterministic normalization. Directory entries must not include `text`, `bytes`, or `content`.

`writeTar(path, entries)` and `readTar(path)` are the default async file helpers. They are layered over the default async `jayess:fs` byte helpers and should be consumed with `await`.

`writeTarSync(path, entries)` and `readTarSync(path)` are the direct synchronous variants layered over `jayess:fs` `Sync` byte helpers.

## Directory Helpers

`createTarFromDirectory(root)` and `createTarFromDirectorySync(root)` walk a directory tree through `jayess:fs`, convert deterministic walk entries into tar entries, and return `jayess:bytes`. Directory entries remain explicit; regular files read bytes from disk. The first filesystem slice supports only files and directories.

`extractTarToDirectory(bytes, targetDir)` and `extractTarToDirectorySync(bytes, targetDir)` extract tar entries into a target directory. They create missing directories, write file bytes, and return the extracted entry count.

The directory helpers preserve the tar path rules from `createTar` / `extractTar` and add a target-directory containment check before writing files. Archive paths must stay relative and must not include absolute paths, drive-letter paths, backslashes, `.`, `..`, or empty segments. The optional `options` argument is reserved; non-null options currently throw a focused unsupported-options diagnostic.

Compression and zip support are intentionally separate from this tar-focused module surface.
