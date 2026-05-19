# Jayess `jayess:string` Module

`jayess:string` provides explicit string helpers for code that should not rely on ambient JavaScript globals.

## Exports

- `trim(text)`
- `startsWith(text, prefix)`
- `endsWith(text, suffix)`
- `includes(text, needle)`
- `slice(text, start, end)`
- `split(text, separator)`

## Current Semantics

- `trim(text)` requires a string and removes leading and trailing whitespace.
- `startsWith(text, prefix)` returns a boolean.
- `endsWith(text, suffix)` returns a boolean.
- `includes(text, needle)` returns a boolean.
- `slice(text, start)` returns from `start` to the end of the string.
- `slice(text, start, end)` returns from `start` up to `end`.
- negative slice indexes clamp to `0`.
- out-of-range slice indexes clamp to the string length.
- `split(text, separator)` requires a string separator and returns a Jayess array of strings.
- an empty separator splits into single-character strings.

## Ownership Split

The module is split across:

- `stdlib/jayess/string/index.js`
- `stdlib/jayess/string/string-primitives.hpp`
- `src/cpp/runtime-string-source.js`

The public module surface stays Jayess-owned. The C++ runtime owns string validation and primitive string operations.
