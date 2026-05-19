# Jayess `jayess:math` Module

Jayess exposes deterministic numeric helpers through an explicit module:

- `jayess:math`

It does not expose JavaScript ambient `Math`.

## Exports

The shipped exports are:

- `abs(value)`
- `floor(value)`
- `ceil(value)`
- `round(value)`
- `min(...values)`
- `max(...values)`
- `sqrt(value)`
- `pow(base, exponent)`

## Semantics

The current helper surface is numeric-only.

- Every argument must be a Jayess number.
- `min(...values)` and `max(...values)` require at least one numeric argument.
- Invalid helper arguments throw focused runtime diagnostics.
- `round(value)` uses the C++ standard-library rounding behavior, which rounds halfway cases away from zero.
- `sqrt(value)` returns Jayess `null` for negative input.
- The helpers do not coerce strings, booleans, arrays, objects, or null into numbers.

Examples:

- `abs(-3)` => `3`
- `floor(1.9)` => `1`
- `ceil(1.1)` => `2`
- `round(1.5)` => `2`
- `min(3, -1, 2)` => `-1`
- `max(3, -1, 2)` => `3`
- `sqrt(9)` => `3`
- `sqrt(-1)` => `null`
- `pow(2, 3)` => `8`

## Ownership Split

The math module is split across:

- `stdlib/jayess/math/index.js`
- `stdlib/jayess/math/math-primitives.hpp`
- `src/cpp/runtime-math-source.js`

The C++ runtime owns numeric validation and primitive operations. The public module surface stays Jayess-owned and explicit.
