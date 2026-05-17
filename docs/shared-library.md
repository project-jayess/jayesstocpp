# Shared-Library-Oriented Output

Jayess remains a source transpiler. It does not compile a `.dll`, `.so`, or `.dylib` itself.

## Native Library Artifact Imports

Jayess source may reference native library artifacts directly:

```js
import { nativeAdd } from "./native/math.hpp";
import "./native/math.dll";
import "./native/math.lib";
```

Rules:

- library artifacts must be accompanied by a matching header import
- `.dll`, `.so`, `.dylib`, `.a`, and `.lib` are treated as native library artifacts
- library artifacts are copied under the generated target directory
- library artifacts are never parsed as Jayess source

## Shared-Library Project Layout

`transpileFile(entryFilename, targetDirname, { projectKind: "shared-library" })` writes a shared-library-oriented source layout under the target directory.

Current files:

- `shared-library/jayess_exports.hpp`
- `shared-library/jayess_entry.hpp`
- `shared-library/jayess_entry.cpp`
- `shared-library/jayess_shared_library.json`

The generated `jayess_library_entry()` function calls the entry module's `jayess_module_init()` and gives external build systems one stable native entrypoint to expose.

## Current Scope

This layout is intentionally small:

- it provides source files and metadata only
- it does not invoke a compiler or linker
- it does not attempt cross-platform packaging automation
- it is meant to be consumed by an external compiler or build system

## Expected Post-Transpile Build Steps

After `transpileFile(..., { projectKind: "shared-library" })`, an external build system is expected to:

1. compile the generated module `.cpp` files
2. compile `runtime/jayess_runtime.cpp`
3. compile `shared-library/jayess_entry.cpp`
4. build those objects into the target shared library
5. define `JAYESS_SHARED_LIBRARY_BUILD` when exporting the library entrypoint on Windows

The shared-library manifest currently records:

- the chosen library name
- the entry module header
- the entry module namespace
- the exported native entry function name

See [generated-project-shape.md](./generated-project-shape.md) for the broader generated layout contract.
