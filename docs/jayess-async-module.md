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

## Export Surface

The shipped `jayess:async` composition surface stays intentionally narrow:

- `resolved(value)`
- `rejected(error)`
- `all(handles)`
- `allSettled(handles)`
- `any(handles)`
- `race(handles)`
- `sleep(milliseconds)`
- `timeout(handle, milliseconds)`
- `withTimeout(handle, milliseconds)`
- `catchError(handle, callback)`
- `finallyDo(handle, callback)`
- `delay(value, milliseconds)`
- `retry(callback, count)`
- `isAsync(value)`
- `createCancellationToken()`
- `cancel(token, reason)`
- `isCancelled(token)`
- `cancellationReason(token)`
- `whenCancelled(token)`
- `withCancellation(handle, token)`
- `sleepWithCancellation(milliseconds, token)`
- `timeoutWithCancellation(handle, milliseconds, token)`

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
- `allSettled(handles)` always resolves with per-handle result objects
- `any(handles)` resolves with the first resolved input
- `any(handles)` rejects with a Jayess array of rejection values when every input rejects
- `race(handles)` completes with the first input completion, whether that completion is success or failure
- `sleep(milliseconds)` returns a Jayess async handle that resolves with Jayess null after the scheduler runs a non-negative integer delay
- `timeout(handle, milliseconds)` resolves or rejects with the input handle if it settles first, or rejects with `"Jayess async operation timed out"` when the scheduled timeout wins
- `withTimeout(handle, milliseconds)` is the named composition alias for `timeout(handle, milliseconds)`
- `catchError(handle, callback)` passes a rejection value to a callback and resolves with the callback result
- `finallyDo(handle, callback)` runs cleanup after either success or rejection, then preserves the original completion unless cleanup fails
- `delay(value, milliseconds)` resolves a value after the scheduler delay expires
- `retry(callback, count)` calls a callback until it returns or resolves successfully, or rejects with the final failure after `count` attempts
- `createCancellationToken()` creates an explicit cancellation token
- `cancel(token, reason)` marks a token cancelled and schedules waiting continuations
- `isCancelled(token)` reports token state
- `cancellationReason(token)` returns the cancellation reason or `null`
- `whenCancelled(token)` resolves with the cancellation reason when a token is cancelled
- `withCancellation(handle, token)` rejects with the token reason if cancellation wins before the handle settles
- `sleepWithCancellation(milliseconds, token)` composes scheduler sleep with cancellation
- `timeoutWithCancellation(handle, milliseconds, token)` composes timeout and cancellation

These rules are Jayess-owned async-handle semantics, not JavaScript Promise compatibility promises.

## `catch` And `finally`

`catchError(...)` and `finallyDo(...)` are function exports over Jayess async handles. They are not methods and do not add JavaScript `Promise` chaining.

## Surface Rationale

This first shipped shape supports:

- construction of already-completed async values
- construction of already-failed async values
- small, explicit composition over multiple async handles
- simple scheduler-backed sleep and timeout composition
- explicit cancellation-token composition
- explicit recovery, cleanup, delay, and retry composition
- runtime introspection when tooling or library code needs to branch on async values

It is not meant to emulate the JavaScript `Promise` API.

## Current Non-Goals

The shipped `jayess:async` module does not include:

- `then`
- ambient `Promise` globals
- async iteration helpers

Cancellation tokens are Jayess-owned handles and are not JavaScript `AbortController` compatibility.

These are excluded because Jayess async composition stays Jayess-owned instead of adopting JavaScript `Promise` programming style.

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
- async class methods reuse the same async-handle runtime model as async function declarations
- async constructors remain unsupported by design
- generated modules expose `jayess_module_init_async()` as an async-handle wrapper around the existing synchronous `jayess_module_init()` entry point
- top-level `await` remains unsupported, so module source still initializes through closed compile-time graph ordering

The current scheduler is cooperative and runs queued async work when `await` needs a pending handle to settle. `sleep(...)` and `timeout(...)` use a Jayess-owned timer queue. Due timers are moved onto the same scheduler queue as async continuations; timers that are not due do not block the scheduler thread. These are deterministic helper primitives, not a JavaScript event loop.

## Implementation Split

The shipped first slice is split across:

- `stdlib/jayess/async/index.js`
- `stdlib/jayess/async/async-primitives.hpp`
- `src/cpp/runtime-async-source.js`

The C++ runtime owns only the primitive async-handle state, cancellation-token state, and the narrow `all` / `allSettled` / `any` / `race` / `sleep` / `timeout` / cancellation composition machinery. The public module surface stays Jayess-owned.
