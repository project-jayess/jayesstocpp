# Generated Project Shape

This document describes the current output shape written by `transpileFile(entryFilename, targetDirname, options?)`.

It records the current layout as contributor-facing contract, not a promise of a future build system.

## Core Rules

- `transpileFile()` writes only under `targetDirname`
- generated Jayess modules are emitted as paired `.hpp` and `.cpp` files
- filenames are derived from stable module stems based on the source path relative to the project root
- repeated runs with the same inputs should produce the same generated file contents and file naming

## Module Filename Encoding

Current module stems are derived by:

- taking the module path relative to the project root
- normalizing separators to `/`
- replacing path separators and punctuation with `_`

Examples:

- entry `main.js` relative to the current project root → `main_js`
- `../node_modules/jayess-lib/index.js` → `_node_modules_jayess_lib_index_js`
- `../node_modules/@scope/math/src/index.js` → `_node_modules__scope_math_src_index_js`

This keeps package and scoped-package identity visible without flattening everything to ambiguous short names.

## Current Output Files

Every generated project currently includes:

- generated module headers such as `main_js.hpp`
- generated module sources such as `main_js.cpp`
- `runtime/jayess_runtime.hpp`
- `runtime/jayess_runtime.cpp`

When native artifacts are imported, the generated target may also include:

- `native/*.hpp`, `native/*.cpp`, or other copied native headers/sources
- `libraries/*.dll`, `libraries/*.lib`, `libraries/*.so`, `libraries/*.dylib`, or static-library artifacts

Native artifacts are copied under deterministic bucket directories:

- headers and native source files under `native/`
- shared/static library artifacts under `libraries/`

## Shared-Library-Oriented Layout

When `transpileFile(..., { projectKind: "shared-library" })` is used, the generated target also includes:

- `shared-library/jayess_exports.hpp`
- `shared-library/jayess_entry.hpp`
- `shared-library/jayess_entry.cpp`
- `shared-library/jayess_shared_library.json`

The JSON file is intentionally small and acts as the only current manifest-like output for this mode.

## Current Non-Goals

- no general dependency-plan file is emitted for ordinary transpile output today
- no build graph, lockfile, or package-manager metadata is generated
- the transpiler does not invoke the compiler or linker itself
- the generated layout is meant for downstream external build tooling
