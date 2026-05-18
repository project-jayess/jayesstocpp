# `jayess:async` Module

This document records the shipped first module-level async-composition surface for Jayess.

The goal is to make async support a Jayess-owned language/runtime feature, not a thin wrapper over ambient JavaScript `Promise`.

## Permanent Language Decision

Jayess does not expose JavaScript `Promise` as a language/runtime surface.

That means:

- no ambient global `Promise`
- no requirement that Jayess async handles mimic JavaScript `Promise` methods
- no obligation to preserve JavaScript `Promise` chaining style

Jayess keeps `async` / `await` as language syntax, but composition must stay Jayess-owned.

## Module Identity

The preferred built-in async module is:

- `jayess:async`

It should resolve like other repository-owned Jayess core modules:

- through the normal module graph
- through explicit imports
- into generated output under `transpileFile()`

## First Export Surface

The first shipped `jayess:async` composition surface stays intentionally narrow:

- `resolved(value)`
- `rejected(error)`
- `all(handles)`
- `race(handles)`
- `isAsync(value)`

These functions operate on Jayess async handles, not on ambient JavaScript Promises.

## Chaining Shape

The first shipped slice does not use handle methods or JavaScript-style method chaining.

The approved shape is:

- function exports only
- explicit helper calls over Jayess async handles

This keeps the first composition layer simple and avoids growing an implicit Promise-like method surface.

## Rejection Propagation

The first shipped slice uses explicit Jayess async-handle failure propagation rules:

- `resolved(value)` creates an already-resolved Jayess async handle
- `rejected(error)` creates an already-failed Jayess async handle
- `all(handles)` resolves when every input resolves
- `all(handles)` fails immediately when the first input fails
- `race(handles)` completes with the first input completion, whether that completion is success or failure

These rules are Jayess-owned async-handle semantics, not JavaScript Promise compatibility promises.

## `catch` And `finally`

`catch` and `finally`-style async composition helpers remain out of the first shipped composition slice.

The first shipped composition layer focuses only on:

- already-resolved handles
- already-failed handles
- `all(...)`
- `race(...)`
- async-handle introspection

## Surface Rationale

This first shipped shape supports:

- construction of already-completed async values
- construction of already-failed async values
- small, explicit composition over multiple async handles
- runtime introspection when tooling or library code needs to branch on async values

It is not meant to emulate the JavaScript `Promise` API.

## Deferred To Later Async Slices

Keep these out of later follow-up work unless the runtime design proves they are required:

- `then`
- `catch`
- `finally`
- ambient `Promise` globals
- scheduler/event-loop control APIs
- async iteration helpers

These are not “Promise work to finish later.” They are excluded because Jayess async composition should stay Jayess-owned instead of adopting JavaScript `Promise` programming style.

## Relationship To `await`

The preferred contract is:

- `async function` returns a Jayess async handle
- `await expr` consumes a Jayess async handle
- `jayess:async` provides composition helpers around those handles

That keeps the language design clear:

- language syntax drives suspension
- runtime primitives hold async state
- Jayess-owned modules provide higher-level APIs

## Current Boundary

The current async-module plan assumes:

- async function expressions and async arrow functions are part of the current supported async syntax slice and reuse the same async-handle runtime model as async function declarations
- async methods remain a separate later class-system slice
- async constructors remain unsupported by design
- top-level `await` remains unsupported until Jayess defines explicit module-level async initialization ordering

## Implementation Split

The shipped first slice is split across:

- `stdlib/jayess/async/index.js`
- `stdlib/jayess/async/async-primitives.hpp`
- `src/cpp/runtime-async-source.js`

The C++ runtime owns only the primitive async-handle state and the narrow `all` / `race` composition machinery. The public module surface stays Jayess-owned.
