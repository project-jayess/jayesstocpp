# Jayess `jayess:regex` Module

The first shipped regex surface in Jayess is a small Jayess-owned module:

- `jayess:regex`

It does not expose ambient JavaScript `RegExp`, regex literals, or constructor-style compatibility.

## Exports

The shipped exports are:

- `create(pattern, flags)`
- `test(regex, text)`
- `exec(regex, text)`
- `replaceFirst(regex, text, replacement)`
- `replaceAll(regex, text, replacement)`
- `isRegex(value)`

## Current Semantics

The current slice is intentionally narrow.

- `create(pattern)` requires a string pattern and returns a Jayess regex value.
- `create(pattern, flags)` accepts an optional string flags argument.
- supported flags are `i`, `m`, and `s`.
- `i` enables case-insensitive matching.
- `m` enables multiline anchor matching for `^` and `$`.
- `s` enables dot-all matching so `.` can match line terminators.
- duplicate flags throw a focused runtime error.
- unknown flags throw a focused runtime error.
- `test(regex, text)` returns `true` or `false`.
- `exec(regex, text)` returns Jayess `null` when no match exists.
- `exec(regex, text)` returns a Jayess array of matched strings when a match exists.
- that array contains the full match at index `0`, followed by any captured groups.
- `replaceFirst(regex, text, replacement)` returns a new string with only the first match replaced.
- `replaceAll(regex, text, replacement)` returns a new string with all matches replaced.
- replacement helpers accept string replacement text only; callback replacement is not part of this slice.
- regex creation and operations require string inputs where appropriate.
- invalid regex patterns throw a focused runtime error.
- malformed regex flags throw a focused runtime error.

## Ownership Split

The shipped first slice is split across:

- `stdlib/jayess/regex/index.js`
- `stdlib/jayess/regex/regex-primitives.hpp`
- `src/cpp/runtime-regex-source.js`

The C++ runtime owns pattern compilation, flag validation, and matching. The public module surface stays Jayess-owned.

## Non-Goals For This Slice

This first slice does not attempt to provide:

- regex literal syntax like `/abc/`
- `new RegExp(...)`
- ambient global `RegExp`
- split helpers
- callback replacement
- broad JavaScript string/regex compatibility

Those remain separate later slices.
