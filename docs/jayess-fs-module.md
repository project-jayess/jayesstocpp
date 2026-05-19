# Jayess Filesystem Module

`jayess:fs` is the Jayess-owned synchronous filesystem helper module. It is explicit module surface, not an ambient Node.js built-in.

## Surface

- `exists(path)`
- `readText(path)`
- `writeText(path, text)`
- `createDirectories(path)`
- `remove(path)`
- `list(path)`
- `rename(fromPath, toPath)`
- `stat(path)`

All paths are strings. `writeText` also expects string content. File operation failures are reported by the runtime helper instead of silently producing broken generated C++ behavior.

## Implementation Shape

- Jayess wrappers live in `stdlib/jayess/fs/index.js`.
- Native bridge declarations live in `stdlib/jayess/fs/fs-primitives.hpp`.
- Runtime support lives in `src/cpp/runtime-fs-source.js`.

`transpile()` string mode does not resolve `jayess:fs` by default. Use `transpileFile()` so the closed module graph can include the standard module.
