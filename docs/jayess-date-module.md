# Jayess Date Module

This document defines the first intended API surface for the repository-owned `jayess:date` module.

## Module Identity

The first date/time surface belongs to:

- `jayess:date`

It is a Jayess standard-library module, not an ambient global constructor.

## First-Slice API

The first shipped `jayess:date` slice should stay narrow and explicit.

Planned exports:

- `now()`
- `fromUnixMillis(value)`
- `toUnixMillis(date)`
- `isDate(value)`

## First-Slice Semantics

### `now()`

- returns a Jayess date value representing the current wall-clock instant
- takes no arguments

### `fromUnixMillis(value)`

- constructs a Jayess date value from a Unix timestamp in milliseconds
- expects one numeric argument

### `toUnixMillis(date)`

- returns one numeric Unix timestamp in milliseconds from a Jayess date value
- expects one Jayess date value

### `isDate(value)`

- returns `true` when `value` is a Jayess date value from the `jayess:date` module surface
- returns `false` otherwise

## Deliberate Non-Goals For The First Slice

The first `jayess:date` slice should not try to emulate the full JavaScript `Date` object.

Out of scope for the first slice:

- ambient global `Date`
- JavaScript constructor overloading behavior
- locale formatting APIs
- timezone database behavior
- calendar-field getters like `getFullYear()` or `getMonth()`
- string parsing heuristics such as `Date.parse(...)`
- mutation-heavy APIs such as `setHours(...)`

Those can be added later as separate bounded slices after the core date value and timestamp conversion path are stable.

## Intended Layering

The first API surface is intentionally timestamp-centered so the module can start with a small primitive substrate and a small Jayess wrapper layer.

## Current Module Shape

The first Jayess-owned module source now lives at:

- `stdlib/jayess/date/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/date/date-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current resolution behavior:

- `transpileFile()` resolves `jayess:date` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:date` by default

## Primitive Boundary Decision

The first `jayess:date` slice should use mixed ownership:

### Needs C++ Primitive Support

- one first-class Jayess date value representation or a runtime-backed opaque date wrapper
- one primitive clock hook for `now()`
- one primitive constructor/conversion path from Unix milliseconds into a Jayess date value
- one primitive conversion path from a Jayess date value back to Unix milliseconds
- one primitive type check used by `isDate(value)`

These belong in C++ because Jayess cannot manufacture a stable wall-clock instant or opaque native timestamp carrier safely by itself.

### Can Live In Jayess Module Code

- the public `jayess:date` export surface
- argument-count validation wrappers when the module shape chooses to keep those at the library layer
- future convenience helpers that compose over the primitive timestamp/date conversions
- future formatting or calendar helpers once the primitive date carrier exists

The first slice should keep the Jayess module thin and let it forward into a small primitive layer.

### Explicit First-Slice Decision

- `now()` requires a C++ primitive clock hook
- `fromUnixMillis(value)` requires a C++ primitive date-construction hook
- `toUnixMillis(date)` requires a C++ primitive date-to-number hook
- `isDate(value)` requires a C++ primitive/runtime-recognized type check
- the `jayess:date` module file itself should still be written in Jayess and export those wrappers

## Remaining Follow-Up

The minimal primitive layer now uses a runtime-backed opaque wrapper:

- a Jayess date currently lives in ordinary object storage
- the runtime marks that object with hidden private timestamp fields
- public property lookup does not expose that hidden timestamp carrier

Later work still needs to decide:

- how much argument validation belongs in the Jayess module versus the primitive entry points
- how the first Jayess module file should import or bind those primitives
- whether later calendar or formatting helpers stay in Jayess or need more native support
