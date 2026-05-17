# Jayess Map Module

This document defines the first intended API surface and runtime-boundary decision for the first repository-owned `jayess:collections/map` slice.

## Module Identity

The first `Map` surface belongs to:

- `jayess:collections/map`

It is a Jayess standard-library module, not an ambient global `Map` constructor.

## First-Slice API

The first shipped `jayess:collections/map` slice should stay narrow and explicit.

Planned exports:

- `create()`
- `get(map, key)`
- `set(map, key, value)`
- `has(map, key)`
- `deleteKey(map, key)`
- `clear(map)`
- `size(map)`
- `isMap(value)`

## First-Slice Semantics

### `create()`

- creates one empty Jayess map value
- takes no arguments

### `get(map, key)`

- returns the value currently stored for `key`
- returns `null` when `key` is not present
- expects one Jayess map and one Jayess key value

### `set(map, key, value)`

- stores `value` for `key`
- overwrites an existing entry for the same key without creating a duplicate entry
- returns the same map value for straightforward chaining when desired

### `has(map, key)`

- returns `true` when the key exists in the map
- returns `false` otherwise

### `deleteKey(map, key)`

- removes the entry for `key` when it exists
- returns `true` when an entry was removed
- returns `false` when the key was absent

### `clear(map)`

- removes all entries from the map
- returns the same map value after clearing

### `size(map)`

- returns the current entry count as one numeric value

### `isMap(value)`

- returns `true` when `value` is a Jayess map value from this module surface
- returns `false` otherwise

## Deliberate Non-Goals For The First Slice

The first `jayess:collections/map` slice should not try to emulate the full JavaScript `Map` object surface.

Out of scope for the first slice:

- ambient global `Map`
- constructor overloads like `new Map(iterable)`
- iterator-returning methods such as `keys()`, `values()`, or `entries()`
- callback helpers such as `forEach(...)`
- direct method-call syntax on map instances if the first implementation lands as function exports first
- object/array coercion shims that blur ordinary object semantics with map semantics

Those can land later as separate bounded slices after the dedicated map carrier and entry operations are stable.

## Current Planned Module Shape

The first Jayess-owned module source now lives at:

- `stdlib/jayess/collections/map/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/collections/map/map-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current verification coverage:

- module-graph resolution tests for `jayess:collections/map`
- generated-output tests that verify copied module and bridge artifacts under `transpileFile()`
- compile-validation tests for a small built-in `Map` project

Current resolution behavior:

- `transpileFile()` resolves `jayess:collections/map` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:collections/map` by default

## Primitive Boundary Decision

The first `jayess:collections/map` slice should use mixed ownership.

### Needs A New Runtime Value Kind

The first shipped `Map` slice should use a dedicated runtime value kind instead of a wrapper over plain objects, arrays, or ad hoc closure state.

That value kind is required for three reasons:

- `Map` needs key identity semantics that are not the same as object-property string coercion
- `Map` needs insertion-order iteration and stable entry storage that ordinary object fields do not provide
- `Map` should be distinguishable from ordinary objects and arrays through explicit runtime type checks

The first primitive layer should therefore provide one dedicated map carrier in the Jayess runtime rather than trying to encode `Map` behavior through lower-level wrappers.

### Why Plain Objects Are Not Enough

The current object runtime is string-keyed property storage.

That is a poor fit for `Map` because:

- numeric, boolean, object, class, async, and generator keys would be coerced or lost if routed through object-field names
- insertion order for entry iteration should belong to `Map` itself rather than to ordinary object property rules
- `Map` methods such as `has(key)` or `delete(key)` should operate on Jayess value identity/equality, not on public property lookup paths

The first `Map` slice should not claim support by approximating `Map` through plain object fields.

### Why Pure Jayess Wrappers Are Not Enough

A pure Jayess wrapper over arrays of `[key, value]` pairs would keep the runtime small, but it would make the first shipped slice weaker in the wrong ways:

- key lookup would become linear-time library code for every operation
- key equality rules would be duplicated at the Jayess library layer instead of staying in one runtime path
- future `Set` layering would still need a dedicated container substrate later

That is acceptable for experiments, but not for the intended repository-owned first shipped `Map` slice.

## Intended Ownership Split

### Needs C++ Primitive Support

- one dedicated map-backed runtime carrier
- one key-comparison path shared by map operations
- one stable insertion-order entry store
- primitive operations for `get`, `set`, `has`, `delete`, `clear`, and `size`
- a runtime-recognized `isMap(value)` check

The first primitive layer now has a concrete runtime direction:

- a dedicated `map_ptr` / `map_value` carrier in the shared `value` variant
- one insertion-ordered `entries` store made of `{ key, stored }` pairs
- one shared key-comparison path that delegates to Jayess `equal(...)`
- primitive entry points:
  - `make_map()`
  - `is_map_value(...)`
  - `map_get(...)`
  - `map_set(...)`
  - `map_has(...)`
  - `map_delete(...)`
  - `map_clear(...)`
  - `map_size(...)`

### Can Live In Jayess Module Code

- the public `jayess:collections/map` export surface
- thin wrapper functions or class-like APIs that forward to primitive operations
- later convenience helpers such as entry conversion or composition helpers

## Explicit First-Slice Decision

- the first shipped `Map` slice should use a new runtime value kind
- the public module surface should still be Jayess-owned
- the first shipped slice should not provide an ambient global `Map`
- the first shipped slice should start with function exports, not a large compatibility class surface
- the first shipped slice should not emulate `Map` through plain object fields or array pairs just to claim support

## Next Slice

The next bounded step is to move on to the first `Set` design slice.
