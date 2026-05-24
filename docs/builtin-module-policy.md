# Built-In Module Policy

This document defines the repository-owned built-in module policy for Jayess standard-library modules.

## Reserved Namespace

The repository-owned built-in namespace is:

- `jayess:*`

First planned examples:

- `jayess:date`
- `jayess:json`
- `jayess:collections/map`
- `jayess:collections/set`
- `jayess:async`
- `jayess:iter`
- `jayess:fs`
- `jayess:path`
- `jayess:process`
- `jayess:subprocess`

This namespace is reserved for repository-provided Jayess modules only. It must stay distinct from:

- `cpp:*` native standard-library dependency imports
- `node:*` unsupported ambient Node built-ins
- relative Jayess modules such as `./math.js`
- package Jayess modules resolved from `node_modules`

## Resolution Contract

### `transpileFile()`

`transpileFile(entryFilename, targetDirname)` should treat `jayess:*` modules as first-class Jayess modules in the normal module graph.

Current repository contract:

- `jayess:*` module imports resolve through repository-owned module metadata and filesystem layout
- resolved built-in modules join dependency planning exactly like other Jayess modules
- transpiled output for built-in modules is emitted only under `targetDirname`
- generated built-in module `.hpp` and `.cpp` files are written under `generated-stdlib/jayess/...`
- built-in modules keep encoded module identity and do not collapse into ad hoc globals
- built-in modules do not bypass path-safety or generated-file determinism rules

For example, importing `jayess:string` includes `stdlib/jayess/string/index.js` in the module graph and emits generated C++ under `generated-stdlib/jayess/string/`. Native bridge headers used by stdlib modules are still copied into `native/`.

### `transpile()`

`transpile(source, options?)` stays conservative in string-only mode.

Current repository contract:

- `transpile()` must not implicitly read repository built-in module files by default
- if a source string imports `jayess:*`, resolution requires explicit resolver/module options
- without explicit resolution support, `transpile()` should produce a focused diagnostic instead of silently pretending the built-in exists

This keeps string-mode deterministic and avoids hidden filesystem coupling.

## Bootstrap Layout

The repository bootstrap layout for built-in Jayess modules is:

- `stdlib/jayess/date/`
- `stdlib/jayess/json/`
- `stdlib/jayess/collections/map/`
- `stdlib/jayess/collections/set/`
- `stdlib/jayess/fs/`
- `stdlib/jayess/path/`
- `stdlib/jayess/process/`
- `stdlib/jayess/subprocess/`

This layout is intentionally Jayess-source-first:

- leaf module directories are expected to hold Jayess `.js` source over time
- helper metadata or resolver maps may be added later
- runtime-only support should stay outside this tree unless a module requires generated native artifacts explicitly

The bootstrap layout does not imply those modules are already fully implemented. It exists so later slices have a stable home and so resolver work does not need to invent paths ad hoc.

## Current Status

Current implementation status:

- the namespace and repository layout are now defined
- `transpileFile()` resolves repository-owned `jayess:*` modules through the normal module graph
- Jayess-owned standard-library and system modules transpile through the normal module graph and copy their native bridge headers into generated output when required
- generated dependency metadata records repository stdlib modules separately from user source, package source, and native artifacts
- `transpile()` string mode still rejects `jayess:*` imports unless explicit resolver support is provided

## Package Diagnostics

Jayess package imports are compile-time module graph inputs, not runtime module loading. Package resolution from `node_modules` should therefore fail early with focused diagnostics when a JavaScript-oriented package shape cannot become a Jayess source module.

Current package diagnostics cover:

- missing package directories
- package entries with unsupported file extensions
- package `exports` maps with no direct Jayess source target
- package export targets whose files are missing
- package entries that point outside the package root
- package roots and selected package fields in relevant package diagnostics

Package `exports` condition objects can use a Jayess-specific `"jayess"` condition. Jayess selects `"jayess"` before `"import"` and `"default"` for root and explicit subpath package exports, and records the selected condition in generated dependency metadata.

These diagnostics preserve the closed module graph model and keep dynamic import and runtime package loading outside the language surface.
