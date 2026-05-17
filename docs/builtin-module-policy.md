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
- built-in modules keep encoded module identity and do not collapse into ad hoc globals
- built-in modules do not bypass path-safety or generated-file determinism rules

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

This layout is intentionally Jayess-source-first:

- leaf module directories are expected to hold Jayess `.js` source over time
- helper metadata or resolver maps may be added later
- runtime-only support should stay outside this tree unless a module requires generated native artifacts explicitly

The bootstrap layout does not imply those modules are already fully implemented. It exists so later slices have a stable home and so resolver work does not need to invent paths ad hoc.

## Current Status

Current implementation status:

- the namespace and repository layout are now defined
- `transpileFile()` now resolves the first repository-owned built-in module slice for `jayess:date`
- `transpileFile()` now also resolves the repository-owned system-module entries `jayess:fs`, `jayess:path`, and `jayess:process`
- the first Jayess-owned `fs` / `path` / `process` modules now transpile through the normal module graph and copy their native bridge headers into generated output
- `transpile()` string mode still rejects `jayess:*` imports unless explicit resolver support is provided
- broader resolver coverage for additional `jayess:*` modules still lands feature-by-feature
