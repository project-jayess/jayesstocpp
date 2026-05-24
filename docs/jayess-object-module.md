# `jayess:object`

This document defines the current shipped `jayess:object` helper surface.

## Exports

The current module exports:

- `has(value, key)`
- `keys(value)`
- `values(value)`
- `entries(value)`
- `fromEntries(entries)`
- `assign(target, source)`

These are function exports from a Jayess-owned module, not ambient global `Object.*` helpers.

## Current Semantics

The current shipped surface is intentionally narrow:

- input must be a Jayess object or callable value
- helper output is always a Jayess array
- key order is deterministic and sorted by public property name
- only public fields participate
- private fields do not participate
- `keys(value)`, `values(value)`, and `entries(value)` reject `null`, arrays, numbers, booleans, and other non-object/non-callable inputs
- `has(value, key)` requires a string key and returns a boolean
- `values(value)` and `entries(value)` follow the same sorted public-key order as `keys(value)`
- `fromEntries(entries)` creates a plain Jayess object from array entries shaped as `[key, value]`
- `fromEntries(entries)` requires each entry to be an array with at least `[key, value]`, and the key must be a string
- `assign(target, source)` copies public fields from `source` into `target` and returns `target`
- `assign(target, source)` requires both `target` and `source` to be Jayess object-like values

`entries(value)` returns a Jayess array of two-element Jayess arrays:

- `[key, storedValue]`

## Ownership Split

The public module surface is Jayess-owned:

- `stdlib/jayess/object/index.js`

The primitive helpers are runtime-backed:

- `stdlib/jayess/object/object-primitives.hpp`
- `src/cpp/runtime-object-source.js`

This matches the repository rule that higher-level standard-library APIs prefer Jayess modules over ambient JavaScript global emulation.

## Non-Goals In This Slice

This slice does not attempt to emulate the full JavaScript `Object` global.

Outside the current module surface:

- ambient `Object.keys(...)` / `Object.values(...)` / `Object.entries(...)`
- descriptor/reflection helpers
- prototype-introspection helpers
- sealing/freezing helpers

## Verification

The shipped slice is covered through:

- module-graph resolution for `jayess:object`
- generated-output checks for built-in-module emission
- runtime helper coverage
- compile validation through `transpileFile(...)`
