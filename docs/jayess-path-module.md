# Jayess Path Module

`jayess:path` is the Jayess-owned path helper module. It is resolved at transpile time and lowers to a small native adapter layer in generated C++.

## Surface

- `join(...parts)`
- `dirname(path)`
- `basename(path)`
- `extname(path)`
- `normalize(path)`
- `resolve(...parts)`
- `relative(fromPath, toPath)`
- `isAbsolute(path)`

All arguments are expected to be strings. Path separator and normalization behavior is isolated in the C++ runtime support so Jayess source does not depend on ambient Node.js path APIs.

## Implementation Shape

- Jayess wrappers live in `stdlib/jayess/path/index.js`.
- Native bridge declarations live in `stdlib/jayess/path/path-primitives.hpp`.
- Runtime support lives in `src/cpp/runtime-path-source.js`.

`transpile()` string mode does not resolve `jayess:path` by default. Use `transpileFile()` so the closed module graph can include the standard module.
