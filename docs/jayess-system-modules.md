# Jayess System Modules

This document defines the shipped Jayess-owned system-module surfaces for filesystem, operating-system information, path, process, subprocess, system, and thread features.

## Module Namespace

The shipped Jayess-owned system modules are:

- `jayess:fs`
- `jayess:os`
- `jayess:path`
- `jayess:process`
- `jayess:subprocess`
- `jayess:system`
- `jayess:thread`

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
- filesystem, operating-system information, path, and process behavior must land through deliberate Jayess module design rather than ambient Node emulation

## First Shipped Surface Areas

### `jayess:fs`

The shipped `jayess:fs` surface stays narrow. Default operations return Jayess async handles; `Sync` suffixed variants perform the same operations synchronously.

Shipped exports:

- `exists(path)`
- `readText(path)`
- `readBytes(path)`
- `writeText(path, text)`
- `writeBytes(path, bytes)`
- `appendText(path, text)`
- `copy(fromPath, toPath)`
- `createDirectories(path)`
- `remove(path)`
- `list(path)`
- `rename(fromPath, toPath)`
- `stat(path)`
- `existsSync(path)`
- `readTextSync(path)`
- `readBytesSync(path)`
- `writeTextSync(path, text)`
- `writeBytesSync(path, bytes)`
- `appendTextSync(path, text)`
- `copySync(fromPath, toPath)`
- `createDirectoriesSync(path)`
- `removeSync(path)`
- `listSync(path)`
- `renameSync(fromPath, toPath)`
- `statSync(path)`

### `jayess:path`

The shipped `jayess:path` surface exposes portable path-shaping helpers rather than platform-specific shell behavior.

Shipped exports:

- `join(...)`
- `dirname(path)`
- `basename(path)`
- `extname(path)`
- `normalize(path)`
- `resolve(...)`
- `relative(fromPath, toPath)`
- `isAbsolute(path)`

### `jayess:os`

The shipped `jayess:os` surface exposes portable operating-system information without broad host compatibility.

Shipped exports:

- `platform()`
- `arch()`
- `homeDir()`
- `tmpDir()`
- `hostname()`
- `newline()`

### `jayess:process`

The shipped `jayess:process` surface stays narrow and explicit.

Shipped exports:

- `argv()`
- `cwd()`
- `getEnv(key)`
- `exit(code)`

### `jayess:subprocess`

The shipped `jayess:subprocess` surface exposes explicit process execution without ambient Node compatibility.

Shipped exports:

- `run(command, args, options)`
- `spawn(command, args, options)`
- `join(handle)`
- `kill(handle)`

### `jayess:system`

The shipped `jayess:system` surface exposes small process-state helpers without broad host compatibility.

Shipped exports:

- `args()`
- `cwd()`
- `getEnv(name)`
- `hasEnv(name)`
- `exitCode(value)`

### `jayess:thread`

The shipped `jayess:thread` surface exposes explicit Jayess-owned thread helpers.

Shipped exports:

- `spawn(callback, args)`
- `join(handle)`
- `sleep(milliseconds)`
- `hardwareConcurrency()`
- `currentId()`

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
- subprocess start, wait, output capture, timeout, and termination
- platform and architecture detection
- home, temporary directory, hostname, and newline lookup
- system exit-code storage
- thread creation, joining, sleeping, and identity lookup

These should land as small C++ adapter primitives with explicit signatures and bounded behavior.

The first concrete primitive layer now uses explicit runtime entry points for:

- `fs_exists_path(...)`
- `fs_read_text_file(...)`
- `fs_read_bytes_file(...)`
- `fs_write_text_file(...)`
- `fs_write_bytes_file(...)`
- `fs_append_text_file(...)`
- `fs_copy_path(...)`
- `fs_create_directories(...)`
- `fs_remove_path(...)`
- `fs_list_directory(...)`
- `fs_rename_path(...)`
- `fs_stat_path(...)`
- `path_join_parts(...)`
- `path_dirname(...)`
- `path_basename(...)`
- `path_extname(...)`
- `path_normalize(...)`
- `path_resolve_parts(...)`
- `path_relative_between(...)`
- `path_is_absolute(...)`
- `os_platform()`
- `os_arch()`
- `os_home_directory()`
- `os_temporary_directory()`
- `os_hostname()`
- `os_newline()`
- `process_current_working_directory()`
- `process_get_env(...)`
- `process_set_argv(...)`
- `process_get_argv()`
- `process_exit_with_code(...)`
- `subprocess_run_async(...)`
- `subprocess_spawn(...)`
- `subprocess_join(...)`
- `subprocess_kill(...)`
- `system_set_exit_code(...)`
- `system_get_exit_code()`
- `thread_spawn(...)`
- `thread_join(...)`
- `thread_sleep(...)`
- `thread_hardware_concurrency()`
- `thread_current_id()`

### Can Live Mostly In Jayess Modules

These behaviors can be Jayess-owned wrappers once the primitive hooks exist:

- module export shaping
- argument validation helpers
- higher-level convenience wrappers over text-file primitives
- pure path manipulation helpers when practical

For the first slice, `jayess:path` may still use a small native helper path if that keeps separator and normalization behavior portable and reviewable.

## Current Module Shape

The shipped Jayess-owned system-module sources live at:

- `stdlib/jayess/fs/index.js`
- `stdlib/jayess/path/index.js`
- `stdlib/jayess/process/index.js`
- `stdlib/jayess/subprocess/index.js`
- `stdlib/jayess/system/index.js`
- `stdlib/jayess/thread/index.js`

The native primitive bridges for those modules live at:

- `stdlib/jayess/fs/fs-primitives.hpp`
- `stdlib/jayess/path/path-primitives.hpp`
- `stdlib/jayess/process/process-primitives.hpp`
- `stdlib/jayess/subprocess/subprocess-primitives.hpp`
- `stdlib/jayess/system/system-primitives.hpp`
- `stdlib/jayess/thread/thread-primitives.hpp`

Each module stays intentionally thin and forwards directly into the primitive layer.

## Current Verification Coverage

- module-graph resolution tests for `jayess:fs`, `jayess:os`, `jayess:path`, `jayess:process`, `jayess:subprocess`, `jayess:system`, and `jayess:thread`
- generated-output tests that verify the Jayess modules and native bridge headers are written into `transpileFile()` output
- compile-validation tests that confirm a generated project importing Jayess system modules compiles with the available C++ compiler
- string-mode API tests that keep `transpile()` conservative for `jayess:*` imports without explicit resolver support

## Explicit First-Slice Rules

- the shipped system-module namespace includes `jayess:fs`, `jayess:os`, `jayess:path`, `jayess:process`, `jayess:subprocess`, `jayess:system`, and `jayess:thread`
- raw `node:*` imports remain unsupported in Jayess source
- system-module helpers are synchronous and explicit unless documented otherwise
- system-module helpers should prefer small adapter primitives over broad Node compatibility layers
- the public module surface should remain Jayess-owned even when native primitives are required underneath

## Current Scope Limits

The shipped system-module surface is intentionally narrow:

- narrow helper-only surfaces with async behavior only where module docs define it
- explicit file, path, process, subprocess, system, and thread helpers only
- no ambient `node:*` compatibility layer

## Current `jayess:subprocess` Notes

`jayess:subprocess` is the shipped Jayess-owned process execution module.

See [`jayess:subprocess` Module](./jayess-subprocess-module.md) for the API shape.

The first slice exposes:

- `run(command, args, options)` for command completion with captured `stdout`, `stderr`, and `exitCode`
- `spawn(command, args, options)` for explicit process handles
- `join(handle)` for waiting on a process handle and returning captured completion data
- `kill(handle)` for explicit process termination

The module keeps execution explicit:

- commands use an executable string plus an args array
- shell execution is not the default behavior
- `cwd`, `env`, `stdin`, and `timeoutMillis` settings are passed through object-shaped options
- environment options apply only to the child process
- ambient `node:child_process` imports remain unsupported

## Current `jayess:fs` Notes

- `remove(path)` removes one file path only; directory-removal policy stays separate
- `readBytes(path)` and `writeBytes(path, bytes)` use `jayess:bytes` values for binary payloads
- `appendText(path, text)` appends text to one file path
- `copy(fromPath, toPath)` copies one file path to another explicit path
- `list(path)` returns a Jayess array of entry names for one directory
- `rename(fromPath, toPath)` covers rename/move through one explicit path-to-path operation
- `stat(path)` returns a narrow Jayess object with:
  - `exists`
  - `isFile`
  - `isDirectory`
  - `size`

- recursive directory walking
- remove-directory trees
- streams/watchers

## Current `jayess:path` Notes

- `resolve(...)` joins path parts and returns one normalized absolute-style path using the host current directory as the base when needed
- `relative(fromPath, toPath)` returns a normalized relative path from one location to another
- `isAbsolute(path)` returns whether a path is already absolute on current host rules

- path parsing objects
- glob helpers
- URL/path bridging
- separator exposure APIs

## Current `jayess:process` Notes

- `argv()` returns a Jayess array of process argument strings from runtime-owned argv storage
- `exit(code)` remains the only shipped exit primitive

- env mutation helpers such as `setEnv(...)` or `deleteEnv(...)`
- exit hooks or signals APIs

## Current `jayess:system` Notes

- `args()` returns process arguments through the same runtime-owned argument storage as `jayess:process.argv()`
- `cwd()` returns the current working directory
- `getEnv(name)` returns one environment value or `null`
- `hasEnv(name)` returns whether an environment variable is present
- `exitCode(value)` stores a process exit code without immediately terminating

The shipped surface does not include env mutation or signal APIs. Subprocess execution belongs to the Jayess-owned `jayess:subprocess` module.

## Current `jayess:thread` Notes

- `spawn(callback, args)` runs one Jayess callable with explicit argument data on a runtime thread handle
- `join(handle)` waits for a thread handle and returns its result
- `sleep(milliseconds)` blocks the current thread for the requested duration
- `hardwareConcurrency()` returns the host concurrency count as a number
- `currentId()` returns a stable string representation for the current runtime thread id

The shipped surface does not include shared-memory APIs, locks, channels, atomics, or scheduler control.

## Current Primitive-Layer Notes

- `fs_list_directory(...)` returns a Jayess array of entry names in sorted order so generated behavior stays deterministic across runs.
- `fs_stat_path(...)` returns a narrow Jayess object with `exists`, `isFile`, `isDirectory`, and `size`.
- `process_get_argv()` currently reads from runtime-owned argv storage populated through `process_set_argv(...)`; until a host entry point provides values, that storage defaults to an empty argument list.
- `system_set_exit_code(...)` stores an exit code separately from immediate process termination.
- `thread_spawn(...)` returns an explicit thread handle that must be passed to `thread_join(...)` to observe completion.
