# Jayess System Modules

This document defines the first planned Jayess-owned system-module slice for filesystem, path, and process features.

## Module Namespace

The first Jayess-owned system modules belong to:

- `jayess:fs`
- `jayess:path`
- `jayess:process`

These modules are repository-owned Jayess modules. They are not ambient Node built-ins, and they are not ordinary npm package imports.

## Why Jayess-Owned Modules Instead Of `node:*`

Jayess source should not inherit ambient Node compatibility by default.

The first system-module slice must preserve a clear distinction between:

- JavaScript implementation code used by the transpiler itself
- Jayess source-language APIs
- native adapter primitives used by transpiled C++ output

That means:

- `node:*` remains a rejected import form in Jayess source
- `jayess:*` is the only built-in namespace for Jayess-owned library surfaces
- filesystem, path, and process behavior must land through deliberate Jayess module design rather than ambient Node emulation

## First Shipped Surface Areas

### `jayess:fs`

The first `jayess:fs` slice stays narrow and synchronous.

Shipped exports:

- `exists(path)`
- `readText(path)`
- `writeText(path, text)`
- `createDirectories(path)`

### `jayess:path`

The first `jayess:path` slice exposes portable path-shaping helpers rather than platform-specific shell behavior.

Shipped exports:

- `join(...)`
- `dirname(path)`
- `basename(path)`
- `extname(path)`
- `normalize(path)`

### `jayess:process`

The first `jayess:process` slice stays narrow and explicit.

Shipped exports:

- `cwd()`
- `getEnv(key)`
- `exit(code)`

## Ownership Split

The first system-module slice should use mixed ownership.

### Needs Native Adapter Primitives

These behaviors need native adapter support because Jayess code alone cannot access the host filesystem or process state:

- filesystem reads and writes
- filesystem existence checks
- directory creation
- current working directory lookup
- environment-variable lookup
- process exit

These should land as small C++ adapter primitives with explicit signatures and bounded behavior.

The first concrete primitive layer now uses explicit runtime entry points for:

- `fs_exists_path(...)`
- `fs_read_text_file(...)`
- `fs_write_text_file(...)`
- `fs_create_directories(...)`
- `path_join_parts(...)`
- `path_dirname(...)`
- `path_basename(...)`
- `path_extname(...)`
- `path_normalize(...)`
- `process_current_working_directory()`
- `process_get_env(...)`
- `process_exit_with_code(...)`

### Can Live Mostly In Jayess Modules

These behaviors can be Jayess-owned wrappers once the primitive hooks exist:

- module export shaping
- argument validation helpers
- higher-level convenience wrappers over text-file primitives
- pure path manipulation helpers when practical

For the first slice, `jayess:path` may still use a small native helper path if that keeps separator and normalization behavior portable and reviewable.

## Current Module Shape

The first Jayess-owned system-module sources now live at:

- `stdlib/jayess/fs/index.js`
- `stdlib/jayess/path/index.js`
- `stdlib/jayess/process/index.js`

The current native primitive bridges for those modules live at:

- `stdlib/jayess/fs/fs-primitives.hpp`
- `stdlib/jayess/path/path-primitives.hpp`
- `stdlib/jayess/process/process-primitives.hpp`

Each module stays intentionally thin and forwards directly into the primitive layer.

## Current Verification Coverage

- module-graph resolution tests for `jayess:fs`, `jayess:path`, and `jayess:process`
- generated-output tests that verify the Jayess modules and native bridge headers are written into `transpileFile()` output
- compile-validation tests that confirm a generated project importing Jayess system modules compiles with the available C++ compiler
- string-mode API tests that keep `transpile()` conservative for `jayess:*` imports without explicit resolver support

## Explicit First-Slice Rules

- the first shipped system-module namespace is `jayess:fs`, `jayess:path`, and `jayess:process`
- raw `node:*` imports remain unsupported in Jayess source
- the first system-module slice is synchronous and explicit
- the first system-module slice should prefer small adapter primitives over broad Node compatibility layers
- the public module surface should remain Jayess-owned even when native primitives are required underneath

## Current Scope Limits

The first shipped system-module slice is still intentionally narrow:

- synchronous only
- text-file oriented only
- no directory listing yet
- no raw binary I/O surface yet
- no subprocess spawning yet
- no ambient `node:*` compatibility layer
