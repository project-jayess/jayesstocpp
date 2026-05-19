# Jayess `jayess:system` Module

`jayess:system` provides a compact process-facing module for common host process values.

## Exports

- `args()`
- `cwd()`
- `getEnv(name)`
- `hasEnv(name)`
- `exitCode(value)`

## Current Semantics

- `args()` returns the runtime-owned process argument array.
- `cwd()` returns the current working directory using the runtime filesystem adapter.
- `getEnv(name)` requires a string name and returns the environment value or Jayess `null`.
- `hasEnv(name)` requires a string name and returns whether the environment value exists.
- `exitCode(value)` requires an integer numeric value, stores it in runtime process state, and returns the stored code.

`exitCode(value)` does not terminate the process. Use `jayess:process` `exit(code)` when terminating behavior is needed.

## Ownership Split

The module is split across:

- `stdlib/jayess/system/index.js`
- `stdlib/jayess/system/system-primitives.hpp`
- `src/cpp/runtime-system-source.js`

The public module surface stays Jayess-owned. The runtime owns the narrow host adapter behavior.
