# Generated Project Shape

This document describes the current output shape written by `transpileFile(entryFilename, targetDirname, options?)`.

It records the current layout as contributor-facing contract, not a promise of a future build system.

## Core Rules

- `transpileFile()` writes only under `targetDirname`
- generated Jayess modules are emitted as paired `.hpp` and `.cpp` files
- filenames are derived from stable module stems based on the source path relative to the project root
- repository-owned `jayess:*` standard-library modules are emitted under `generated-stdlib/jayess/`
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

Repository-owned standard-library modules keep their source identity in the output directory:

- `jayess:string` source `stdlib/jayess/string/index.js` → `generated-stdlib/jayess/string/stdlib_jayess_string_index_js.hpp`
- `jayess:collections/map` source `stdlib/jayess/collections/map/index.js` → `generated-stdlib/jayess/collections/map/stdlib_jayess_collections_map_index_js.cpp`

The generated stem remains encoded for namespace stability, while the directory path keeps the bundled stdlib source location readable.

## Current Output Files

Every generated project currently includes:

- generated module headers such as `main_js.hpp`
- generated module sources such as `main_js.cpp`
- generated standard-library headers and sources under `generated-stdlib/jayess/...` when `jayess:*` modules are imported
- `runtime/jayess_runtime.hpp`
- `runtime/jayess_runtime.cpp`
- `jayess_dependency_plan.json`

When native artifacts are imported, the generated target may also include:

- `native/*.hpp`, `native/*.cpp`, or other copied native headers/sources
- `libraries/*.dll`, `libraries/*.lib`, `libraries/*.so`, `libraries/*.dylib`, or static-library artifacts

Native artifacts are copied under deterministic bucket directories:

- headers and native source files under `native/`
- shared/static library artifacts under `libraries/`

## Runtime Fragment Selection

`transpileFile()` emits a closed runtime for the generated module graph. The core Jayess value model and module-initialization async handle support are always included. Optional runtime fragments are selected from parsed syntax and imported `jayess:*` modules.

Examples:

- a simple arithmetic module keeps core helpers and omits `jayess:async` composition helpers and generator helpers
- `async function` and `await` include the async core required to create, resolve, reject, and await Jayess async handles
- importing `jayess:async` adds the async composition helpers such as `all`, `race`, `sleep`, and `timeout`
- generator syntax or importing `jayess:iter` adds generator runtime helpers
- importing `jayess:regex` adds regex helpers; importing `jayess:string` also includes regex support because string replacement accepts regex values

Fragment order and fragment dependencies are fixed in source so generated runtime files stay deterministic for the same input graph. Tests that intentionally inspect the complete runtime can request all fragments through the public transpile-file options used by the test harness.

## Dependency Plan

`jayess_dependency_plan.json` records the closed module graph used by `transpileFile()`.

The plan includes:

- the entry filename
- the project root
- each source module filename
- each source module kind, such as user/package source or repository stdlib source
- each generated module stem
- each generated header/source output path relative to `targetDirname`
- each dependency source string, kind, resolved filename, source kind, generated output paths, and generated module stem when one exists
- each dependency inclusion reason and any runtime features included by that dependency
- platform adapter requirements for native-backed `jayess:*` modules such as `net`, `window`, `gpu`, `clipboard`, `watch`, and `subprocess`
- package metadata for package imports, including package name, package root, selected package field, export key, export condition, package array trace metadata, and main field when applicable

The file is emitted under `targetDirname` and is deterministic for the same input graph.

## Build Hints

`jayess_build_hints.json` is a deterministic metadata file for external build tooling. It records generated source files, the required `C++17` standard, include directories with rationale, runtime files, copied native artifacts, copied library artifacts, platform adapters, platform library hints, and optional backend requirements. It does not invoke the compiler, select a toolchain, or add workflow files.

Repository-owned standard-library modules copied into `generated-stdlib/jayess/...` are also identified in the module manifest with `sourceKind: "repository-stdlib"` and a `standardLibrarySpecifier` such as `jayess:image` or `jayess:collections/map`. The manifest also includes `copiedStandardLibraryModules` as a compact sorted index for build and packaging tools.

## Shared-Library-Oriented Layout

When `transpileFile(..., { projectKind: "shared-library" })` is used, the generated target also includes:

- `shared-library/jayess_exports.hpp`
- `shared-library/jayess_entry.hpp`
- `shared-library/jayess_entry.cpp`
- `shared-library/jayess_shared_library.json`

The JSON file is intentionally small and acts as the only current manifest-like output for this mode.

## Current Non-Goals

- no build graph, lockfile, or package-manager metadata is generated
- the transpiler does not invoke the compiler or linker itself
- the generated layout is meant for downstream external build tooling
