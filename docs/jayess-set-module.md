# Jayess Set Module

This document defines the current shipped API surface and runtime-boundary decision for the repository-owned `jayess:collections/set` module.

## Module Identity

The first `Set` surface belongs to:

- `jayess:collections/set`

It is a Jayess standard-library module, not an ambient global `Set` constructor.

## Current Shipped API

The shipped `jayess:collections/set` surface stays narrow and explicit.

Current exports:

- `create()`
- `add(set, value)`
- `has(set, value)`
- `deleteValue(set, value)`
- `clear(set)`
- `size(set)`
- `values(set)`
- `entries(set)`
- `fromValues(values)`
- `union(left, right)`
- `intersection(left, right)`
- `difference(left, right)`
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

### Iteration Helpers

- `values(set)` returns one Jayess array of members in insertion order
- `entries(set)` returns one Jayess array of `[value, value]` pairs in insertion order

### Bulk And Set-Operation Helpers

- `fromValues(values)` accepts one Jayess array of candidate values and returns a new set
- duplicate values collapse under the set's existing membership rules
- `union(left, right)` returns a new set containing all left values followed by newly added right values
- `intersection(left, right)` returns a new set containing values from `left` that are also in `right`
- `difference(left, right)` returns a new set containing values from `left` that are not in `right`
- set-operation helpers do not mutate their inputs

### `isSet(value)`

- returns `true` when `value` is a Jayess set value from this module surface
- returns `false` otherwise

## Current Non-Goals

The shipped `jayess:collections/set` module does not emulate the full JavaScript `Set` object surface.

Out of scope for the current module surface:

- ambient global `Set`
- constructor overloads like `new Set(iterable)`
- iterator-returning methods such as `keys()`, `values()`, or `entries()`
- callback helpers such as `forEach(...)`
- direct method-call syntax on set instances
- object/array coercion shims that blur ordinary collection semantics with set semantics

## Current Module Shape

The Jayess-owned module source lives at:

- `stdlib/jayess/collections/set/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/collections/set/set-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current resolution behavior:

- `transpileFile()` resolves `jayess:collections/set` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:collections/set` by default

## Primitive Boundary

The shipped `jayess:collections/set` module uses mixed ownership.

### Needs A New Runtime Value Kind

The shipped set module uses a dedicated runtime value kind instead of a wrapper over plain arrays, plain objects, or ad hoc closure state.

That value kind is required for three reasons:

- `Set` needs value-identity membership checks that are not the same as object-property string coercion
- `Set` needs insertion-order element storage that ordinary object fields and ad hoc arrays do not provide cleanly
- set values must be distinguishable from ordinary arrays and objects through explicit runtime type checks

The primitive layer provides one dedicated set carrier in the Jayess runtime rather than encoding set behavior through lower-level wrappers.

### Why Plain Arrays Are Not Enough

An array wrapper can hold values, but it is a poor fit for the first shipped `Set` slice because:

- every membership check would become linear-time library code over ordinary array elements
- duplicate suppression would need to be reimplemented at the Jayess library layer
- array semantics and `Set` semantics would blur in the wrong direction

The shipped set module does not approximate set support through arrays.

### Why Plain Objects Are Not Enough

The current object runtime is string-keyed property storage.

That is a poor fit for `Set` because:

- numeric, boolean, object, class, async, and generator members would be coerced or lost if routed through object-field names
- insertion order for `Set` membership should belong to the `Set` carrier itself rather than ordinary object property rules
- set membership operates on Jayess value identity/equality, not on public property lookup paths

The shipped set module does not approximate set support through object fields.

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

## Explicit First-Slice Decision

- the shipped set slice uses a runtime value kind
- the public module surface is Jayess-owned
- the shipped slice does not provide an ambient global `Set`
- the shipped slice starts with function exports, not a large compatibility class surface
- the shipped slice does not emulate `Set` through arrays or plain object fields just to claim support

## Current Verification Coverage

Current verification coverage:

- module-graph resolution tests for `jayess:collections/set`
- generated-output tests that verify the Jayess module and native bridge are written into `transpileFile()` output
- compile-validation tests that confirm a generated project importing `jayess:collections/set` compiles with the available C++ compiler

## Current Boundaries

The shipped set helper surface keeps iterator-based and callback-based set algebra APIs separate from this data-oriented helper surface.
