# `jayess:process` Module

`jayess:process` exposes focused process metadata and control helpers. It is a Jayess-owned module, not ambient Node.js `process` compatibility.

## Imports

```js
import { argv, cwd, getEnv, hasEnv, envKeys, envEntries, exit } from "jayess:process";
```

## Surface

- `argv()` returns the Jayess process argument list.
- `cwd()` returns the current working directory.
- `getEnv(name)` returns an environment value string or `null` when the key is absent.
- `hasEnv(name)` returns whether an environment key is present.
- `envKeys()` returns current environment variable names.
- `envEntries()` returns `{ key, value }` objects for current environment values.
- `exit(code)` exits the current process with an integer code.

## Boundaries

`jayess:process` supports environment inspection only. It does not mutate the current process environment. Per-child environment values belong to `jayess:subprocess` options and do not change this module's process state.

## Diagnostics

The module throws Jayess runtime errors for:

- non-string or empty environment keys passed to `getEnv` or `hasEnv`
- non-integer exit codes passed to `exit`

## Implementation

- Jayess wrappers live in `stdlib/jayess/process/index.js`.
- Native bridge declarations live in `stdlib/jayess/process/process-primitives.hpp`.
- Runtime helpers live in the system runtime fragment because `jayess:process` and `jayess:system` share the same focused process/system primitive family.
