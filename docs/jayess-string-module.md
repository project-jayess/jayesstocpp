# Jayess `jayess:string` Module

`jayess:string` provides explicit string helpers for code that should not rely on ambient JavaScript globals.

## Exports

- `trim(text)`
- `startsWith(text, prefix)`
- `endsWith(text, suffix)`
- `includes(text, needle)`
- `indexOf(text, needle)`
- `slice(text, start, end)`
- `split(text, separator)`
- `replaceFirst(text, search, replacement)`
- `replaceAll(text, search, replacement)`
- `padStart(text, length, fill)`
- `padEnd(text, length, fill)`
- `repeat(text, count)`
- `toLower(text)`
- `toUpper(text)`

## Current Semantics

- `trim(text)` requires a string and removes leading and trailing whitespace.
- every exported helper validates its own wrapper-level argument count before running string logic.
- `startsWith(text, prefix)` requires a string prefix and returns a boolean.
- `endsWith(text, suffix)` requires a string suffix and returns a boolean.
- `includes(text, needle)` requires a string needle and returns a boolean.
- `indexOf(text, needle)` requires a string needle and returns the zero-based index of the first match, or `-1`.
- `slice(text, start)` returns from `start` to the end of the string.
- `slice(text, start, end)` returns from `start` up to `end`.
- negative slice indexes clamp to `0`.
- out-of-range slice indexes clamp to the string length.
- `split(text, separator)` requires a string separator and returns a Jayess array of strings.
- an empty separator splits into single-character strings.
- splitting an empty string with an empty separator returns an empty Jayess array.
- splitting keeps empty segments when separators are adjacent.
- `replaceFirst(text, search, replacement)` replaces the first plain string or shipped `jayess:regex` match.
- `replaceAll(text, search, replacement)` replaces every plain string or shipped `jayess:regex` match.
- replacement helpers return the original text when `search` is empty.
- `padStart(text, length)` and `padEnd(text, length)` use a single space fill by default.
- `padStart(text, length, fill)` and `padEnd(text, length, fill)` use a string fill value.
- padding helpers return the original text when the target length is not larger than the text or the fill is empty.
- `repeat(text, count)` repeats text `count` times; non-positive counts produce an empty string.
- `toLower(text)` and `toUpper(text)` apply byte-oriented ASCII case conversion.
- plain string search helpers are intentionally non-coercive; they do not stringify numbers, booleans, arrays, or objects into search text.

## Ownership Split

The module is split across:

- `stdlib/jayess/string/index.js`
- `stdlib/jayess/string/string-primitives.hpp`
- `src/cpp/runtime-string-source.js`

The public module surface stays Jayess-owned. The C++ runtime owns string validation and primitive string operations.
