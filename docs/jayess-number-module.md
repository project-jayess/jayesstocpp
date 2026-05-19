# Jayess `jayess:number` Module

The first shipped numeric helper surface in Jayess is a small Jayess-owned module:

- `jayess:number`

It does not expose JavaScript ambient globals like `parseInt` or `parseFloat`.

## Exports

The shipped exports are:

- `isInteger(value)`
- `isFinite(value)`
- `parseInt(text)`
- `parseFloat(text)`

## Current Semantics

The current slice is intentionally narrow.

- `isInteger(value)` returns `true` only for finite Jayess numeric values with no fractional part.
- `isFinite(value)` returns `true` only for finite Jayess numeric values.
- non-number values return `false` from numeric predicate helpers.
- Both helpers require a string input.
- Leading and trailing ASCII whitespace is ignored.
- `parseInt(text)` accepts only full decimal integer text with an optional sign.
- `parseFloat(text)` accepts only full floating-point text with an optional sign and optional exponent.
- Invalid text returns Jayess `null`.
- Trailing junk is rejected instead of being partially consumed.

Examples:

- `parseInt("12")` => `12`
- `parseInt("  -7  ")` => `-7`
- `parseInt("12px")` => `null`
- `parseFloat("1.5")` => `1.5`
- `parseFloat("6e2")` => `600`
- `parseFloat("1.5ms")` => `null`

## Why This Is Module-Owned

This slice stays module-owned because Jayess does not want to grow ambient JavaScript global behavior when a small explicit module is enough.

That keeps the language direction aligned with:

- `jayess:date`
- `jayess:json`
- `jayess:object`
- `jayess:collections/map`
- `jayess:collections/set`

## Ownership Split

The shipped first slice is split across:

- `stdlib/jayess/number/index.js`
- `stdlib/jayess/number/number-primitives.hpp`
- `src/cpp/runtime-number-source.js`

The C++ runtime owns the primitive parsing machinery. The public module surface stays Jayess-owned.

## Non-Goals For This Slice

This first slice does not attempt to provide:

- ambient global `parseInt`
- ambient global `parseFloat`
- radix arguments
- hexadecimal, binary, or octal parsing modes
- formatting helpers
- broader `Number` emulation

Those remain separate future slices.
