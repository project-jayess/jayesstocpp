# Jayess Set Module

This document defines the runtime-boundary decision for the first repository-owned `jayess:collections/set` slice.

## Module Identity

The first `Set` surface belongs to:

- `jayess:collections/set`

It is a Jayess standard-library module, not an ambient global `Set` constructor.

## First-Slice API

The first shipped `jayess:collections/set` slice should stay narrow and explicit.

Planned exports:

- `create()`
- `add(set, value)`
- `has(set, value)`
- `deleteValue(set, value)`
- `clear(set)`
- `size(set)`
- `isSet(value)`

## First-Slice Semantics

### `create()`

- creates one empty Jayess set value
- takes no arguments

### `add(set, value)`

- stores `value` in the set
- suppresses duplicates for values already present under the set membership rules
- returns the same set value for straightforward chaining when desired

### `has(set, value)`

- returns `true` when `value` is already present in the set
- returns `false` otherwise

### `deleteValue(set, value)`

- removes `value` from the set when it exists
- returns `true` when a member was removed
- returns `false` when the value was absent

### `clear(set)`

- removes all members from the set
- returns the same set value after clearing

### `size(set)`

- returns the current member count as one numeric value

### `isSet(value)`

- returns `true` when `value` is a Jayess set value from this module surface
- returns `false` otherwise

## Deliberate Non-Goals For The First Slice

The first `jayess:collections/set` slice should not try to emulate the full JavaScript `Set` object surface.

Out of scope for the first slice:

- ambient global `Set`
- constructor overloads like `new Set(iterable)`
- iterator-returning methods such as `keys()`, `values()`, or `entries()`
- callback helpers such as `forEach(...)`
- direct method-call syntax on set instances if the first implementation lands as function exports first
- object/array coercion shims that blur ordinary collection semantics with set semantics

Those can land later as separate bounded slices after the dedicated set carrier and membership operations are stable.

## Current Planned Module Shape

The first Jayess-owned module source now lives at:

- `stdlib/jayess/collections/set/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/collections/set/set-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current resolution behavior:

- `transpileFile()` resolves `jayess:collections/set` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:collections/set` by default

## Primitive Boundary Decision

The first `jayess:collections/set` slice should use mixed ownership.

### Needs A New Runtime Value Kind

The first shipped `Set` slice should use a dedicated runtime value kind instead of a wrapper over plain arrays, plain objects, or ad hoc closure state.

That value kind is required for three reasons:

- `Set` needs value-identity membership checks that are not the same as object-property string coercion
- `Set` needs insertion-order element storage that ordinary object fields and ad hoc arrays do not provide cleanly
- `Set` should be distinguishable from ordinary arrays and objects through explicit runtime type checks

The first primitive layer should therefore provide one dedicated set carrier in the Jayess runtime rather than trying to encode `Set` behavior through lower-level wrappers.

### Why Plain Arrays Are Not Enough

An array wrapper can hold values, but it is a poor fit for the first shipped `Set` slice because:

- every membership check would become linear-time library code over ordinary array elements
- duplicate suppression would need to be reimplemented at the Jayess library layer
- array semantics and `Set` semantics would blur in the wrong direction

The first `Set` slice should not claim support by approximating `Set` through arrays.

### Why Plain Objects Are Not Enough

The current object runtime is string-keyed property storage.

That is a poor fit for `Set` because:

- numeric, boolean, object, class, async, and generator members would be coerced or lost if routed through object-field names
- insertion order for `Set` membership should belong to the `Set` carrier itself rather than ordinary object property rules
- `Set` membership should operate on Jayess value identity/equality, not on public property lookup paths

The first `Set` slice should not claim support by approximating `Set` through object fields.

## Intended Ownership Split

### Needs C++ Primitive Support

- one dedicated set-backed runtime carrier
- one value-comparison path shared by membership operations
- one stable insertion-order entry store
- primitive operations for `add`, `has`, `delete`, `clear`, and `size`
- a runtime-recognized `isSet(value)` check

The first primitive layer now has a concrete runtime direction:

- a dedicated `set_ptr` / `set_value` carrier in the shared `value` variant
- one insertion-ordered `entries` store made of raw Jayess values
- one shared membership-comparison path that delegates to Jayess `equal(...)`
- primitive entry points:
  - `make_set()`
  - `is_set_value(...)`
  - `set_add(...)`
  - `set_has(...)`
  - `set_delete(...)`
  - `set_clear(...)`
  - `set_size(...)`

### Can Live In Jayess Module Code

- the public `jayess:collections/set` export surface
- thin wrapper functions or class-like APIs that forward to primitive operations
- later convenience helpers such as conversion or composition helpers

## Explicit First-Slice Decision

- the first shipped `Set` slice should use a new runtime value kind
- the public module surface should still be Jayess-owned
- the first shipped slice should not provide an ambient global `Set`
- the first shipped slice should start with function exports, not a large compatibility class surface
- the first shipped slice should not emulate `Set` through arrays or plain object fields just to claim support

## Next Slice

Current verification coverage:

- module-graph resolution tests for `jayess:collections/set`
- generated-output tests that verify the Jayess module and native bridge are written into `transpileFile()` output
- compile-validation tests that confirm a generated project importing `jayess:collections/set` compiles with the available C++ compiler

## Next Slice

The next bounded step is to move on to the first Jayess system-module slice.
