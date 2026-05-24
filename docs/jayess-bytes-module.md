# Jayess `jayess:bytes` Module

`jayess:bytes` is a Jayess-owned standard module for binary data.

Binary data is represented as a distinct Jayess runtime handle, not as a string or array. This keeps byte payloads separate from text while still allowing explicit UTF-8 conversion helpers.

```js
import { concat, fromUtf8, length, toUtf8 } from "jayess:bytes";
```

## Exports

- `fromUtf8(text)`
- `fromArray(values)`
- `toArray(bytes)`
- `toUtf8(bytes)`
- `length(bytes)`
- `get(bytes, index)`
- `set(bytes, index, value)`
- `fill(bytes, value)`
- `slice(bytes, start, end?)`
- `concat(left, right)`
- `equals(left, right)`
- `secureEquals(left, right)`
- `compare(left, right)`
- `startsWith(bytes, prefix)`
- `endsWith(bytes, suffix)`
- `isBytes(value)`

## Semantics

- `fromUtf8(text)` requires a string and returns a bytes value containing the string bytes.
- `fromArray(values)` requires an array of byte numbers from `0` through `255`.
- `toArray(bytes)` returns an array of byte numbers.
- `toUtf8(bytes)` requires a bytes value and returns a string from the stored bytes.
- `length(bytes)` returns the number of stored bytes.
- `get(bytes, index)` returns one byte number and requires an in-range index.
- `set(bytes, index, value)` mutates one byte and returns the same bytes handle.
- `fill(bytes, value)` mutates every stored byte and returns the same bytes handle.
- `slice(bytes, start)` returns bytes from `start` to the end.
- `slice(bytes, start, end)` returns bytes from `start` up to `end`.
- `concat(left, right)` returns a new bytes value with `right` appended after `left`.
- `equals(left, right)` compares byte contents and returns a boolean.
- `secureEquals(left, right)` compares byte contents with a constant-time-style shared-prefix comparison path intended for secret bytes such as digest or MAC checks.
- `compare(left, right)` returns `-1`, `0`, or `1` using lexicographic byte ordering.
- `startsWith(bytes, prefix)` checks whether bytes begins with a byte prefix.
- `endsWith(bytes, suffix)` checks whether bytes ends with a byte suffix.
- `isBytes(value)` returns whether a value is a bytes handle.

`slice` indexes are clamped to the valid byte range. If the computed end is before or equal to the start, `slice` returns an empty bytes value. `get` and `set` use explicit bounds checks and fail when the index is outside the stored byte range.

`set` and `fill` mutate the existing bytes handle in place, so aliases to the same bytes value observe the mutation. `slice` returns a new bytes value instead of a mutable view into the original storage.

Jayess language equality remains exact-type and identity-based for runtime handles. Use `equals(left, right)` when ordinary content equality is intended. Use `secureEquals(left, right)` for secret-byte comparisons such as digest, MAC, or token checks where avoiding early-exit comparisons is the better default.

## Generated Output

The current shipped bytes surface is split across:

- `stdlib/jayess/bytes/index.js`
- `stdlib/jayess/bytes/bytes-primitives.hpp`
- `src/cpp/runtime-bytes-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.

## Related Modules

- [jayess:encoding](./jayess-encoding-module.md)
- [jayess:crypto](./jayess-crypto-module.md)
- [jayess:fs](./jayess-fs-module.md)
