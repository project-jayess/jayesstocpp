# `jayess:async` Module Plan

This document records the intended first module-level async surface for Jayess.

The goal is to make async support a Jayess-owned language/runtime feature, not a thin wrapper over ambient JavaScript `Promise`.

## Module Identity

The preferred built-in async module is:

- `jayess:async`

It should resolve like other repository-owned Jayess core modules:

- through the normal module graph
- through explicit imports
- into generated output under `transpileFile()`

## First Export Surface

The first export surface should stay intentionally narrow:

- `resolved(value)`
- `rejected(error)`
- `all(handles)`
- `race(handles)`
- `isAsync(value)`

These functions operate on Jayess async handles, not on ambient JavaScript Promises.

## Surface Rationale

This first shape is meant to support:

- construction of already-completed async values
- construction of already-failed async values
- small, explicit composition over multiple async handles
- runtime introspection when tooling or library code needs to branch on async values

It is not meant to emulate the full JavaScript `Promise` API in the first slice.

## Deferred To Later Async Slices

Keep these out of the first module slice unless the runtime design proves they are required:

- `then`
- `catch`
- `finally`
- ambient `Promise` globals
- scheduler/event-loop control APIs
- async iteration helpers

## Relationship To `await`

The preferred contract is:

- `async function` returns a Jayess async handle
- `await expr` consumes a Jayess async handle
- `jayess:async` provides composition helpers around those handles

That keeps the language design clear:

- language syntax drives suspension
- runtime primitives hold async state
- Jayess-owned modules provide higher-level APIs
