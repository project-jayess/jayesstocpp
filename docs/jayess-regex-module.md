# Jayess `jayess:regex` Module

The first shipped regex surface in Jayess is a small Jayess-owned module:

- `jayess:regex`

It does not expose ambient JavaScript `RegExp`, regex literals, or constructor-style compatibility.

## Exports

The first shipped exports are:

- `create(pattern)`
- `test(regex, text)`
- `exec(regex, text)`
- `isRegex(value)`

## First-Slice Semantics

The first slice is intentionally narrow.

- `create(pattern)` requires a string pattern and returns a Jayess regex value.
- `test(regex, text)` returns `true` or `false`.
- `exec(regex, text)` returns Jayess `null` when no match exists.
- `exec(regex, text)` returns a Jayess array of matched strings when a match exists.
- that array contains the full match at index `0`, followed by any captured groups.
- regex creation and operations require string inputs where appropriate.
- invalid regex patterns throw a focused runtime error.

## Ownership Split

The shipped first slice is split across:

- `stdlib/jayess/regex/index.js`
- `stdlib/jayess/regex/regex-primitives.hpp`
- `src/cpp/runtime-regex-source.js`

The C++ runtime owns pattern compilation and matching. The public module surface stays Jayess-owned.

## Non-Goals For This Slice

This first slice does not attempt to provide:

- regex literal syntax like `/abc/`
- `new RegExp(...)`
- ambient global `RegExp`
- replacement helpers
- split helpers
- flag arguments
- broad JavaScript string/regex compatibility

Those remain separate later slices.
