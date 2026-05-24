# Regex Roadmap

This document records the current Jayess regex boundary and the shipped first expansion slice.

## Shipped Regex Slice

The first Jayess-owned regex expansion slice is already shipped through `jayess:regex`.

That shipped slice includes:

- explicit module-owned regex creation through `create(pattern, flags?)`
- explicit flags policy with one optional flags string
- the current supported flags set: `i`, `m`, and `s`
- focused diagnostics for duplicate and unknown flags
- `test(regex, text)`
- `exec(regex, text)`
- `split(regex, text)`
- `matchAll(regex, text)`
- `replaceFirst(regex, text, replacement)`
- `replaceAll(regex, text, replacement)`
- `isRegex(value)`
- explicit result-shape policy:
  - `exec(...)` returns Jayess `null` or one match array
  - `matchAll(...)` returns a Jayess array of match arrays
  - each match array contains the full match at index `0`, then captured groups

## Current Boundary

Regex support remains module-owned and explicit.

Jayess does not expose:

- regex literals such as `/abc/`
- ambient/global `RegExp`
- `new RegExp(...)`
- callback replacements

Regex behavior should continue to land through `jayess:regex` instead of ambient JavaScript compatibility.

## Current Direction

The current language direction keeps regex literals out of Jayess.

If regex surface grows further, it should continue from the shipped `jayess:regex` helper model:

- narrow additional module helpers
- focused runtime support only where required
- explicit result-shape and flag policy
- no ambient JavaScript regex globals
