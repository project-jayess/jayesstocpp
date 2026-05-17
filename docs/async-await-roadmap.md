# Async And Await Implementation Plan

Jayess now supports a narrow first `async` / `await` slice, and this document tracks the remaining buildout work.

The current repo state now includes:

- first-slice `async function` declaration parsing
- `await expr` parsing
- legality diagnostics for `await`
- a dedicated Jayess async-result runtime kind plus basic scheduling primitives
- backend lowering for async function declarations
- backend lowering for `await expr` through a single-evaluation runtime helper

## First Supported Surface

The first shipped async slice should stay intentionally narrow:

- support `async function name(...) { ... }`
- support `await expr` only inside approved async function bodies
- treat async functions as ordinary Jayess callable values that return a Jayess async result handle
- do not make ambient JavaScript `Promise` a language dependency

The first slice should not try to ship every async-shaped form at once.

Keep these for later slices unless they become necessary during implementation:

- async function expressions
- async arrow functions
- async methods or constructors as a separate class-model slice
- top-level `await`
- async generators

This keeps the first implementation compatible with the current transpiler architecture:

- explicit AST and semantic flags
- focused runtime primitives
- Jayess-owned library modules layered above the primitive runtime

## Required Build Areas

`async` / `await` needs more than syntax support. Jayess would need a coherent answer for:

- the runtime representation of an async result
- whether that result is Promise-like, task-like, or a Jayess-specific abstraction
- suspension and resumption points in generated C++
- lifetime behavior for locals captured across suspension
- interaction with `try` / `catch` / `finally`
- interaction with the current scope-based cleanup model

The feature should land as a real language/runtime slice, not as parser-only support.

## Current Repository Rule

The current policy is:

- keep unsupported async forms rejected with explicit diagnostics
- reject `await` outside approved async contexts with explicit diagnostics
- keep async function expressions and async arrow functions outside the first shipped slice with explicit diagnostics
- keep fake Promise semantics out of the language
- implement the feature through Jayess-owned runtime and core-library layers

## Runtime Result Model

The first async implementation should introduce one explicit Jayess async-result runtime kind rather than pretending an async function returns an ordinary callable, object, or ambient JavaScript `Promise`.

That runtime shape should look like:

- one C++ runtime async-state object that stores completion status
- one Jayess runtime value kind that points at that async state
- one completion channel that carries either:
  - a resolved Jayess value, or
  - a Jayess-thrown exception payload

In other words:

- async functions return a Jayess-owned async handle value
- `await` consumes that async handle value
- higher-level combinators belong in a Jayess-owned async module such as `jayess:async`

The first slice should avoid reusing ordinary callable/object storage for the async result itself because:

- completion state differs from ordinary object lifetime
- suspension/resumption needs explicit state transitions
- exception completion must be tracked separately from plain values

## Lifetime Rules Across `await`

`await` creates a suspension boundary, so the first implementation needs explicit frame promotion rules.

The intended first-slice rules are:

- any local binding whose value is used after an `await` must live in an async frame, not on a purely stack-local path
- any captured outer binding referenced after suspension must be retained through the async frame or through a frame-owned environment object
- temporaries that are fully consumed before the suspension point may still use ordinary local cleanup
- scope-exit cleanup must not destroy bindings that remain live across suspension
- async-frame cleanup must run exactly once when the async result reaches final completion or final failure

A practical lowering rule for the first slice is:

- compute liveness across each `await`
- promote live-after-await bindings into a heap-backed async frame
- keep dead-before-await temporaries in ordinary local storage

This preserves Jayess scope-based cleanup while still allowing suspension.

## `try` / `catch` / `finally` Across Suspension

The first async slice should define exception behavior explicitly rather than inheriting C++ coroutine behavior by accident.

Repository direction:

- `try` / `catch` inside async functions should remain Jayess-visible control flow
- exceptions thrown before suspension and after resumption should both flow through the same Jayess async frame
- async completion by failure should preserve a Jayess exception payload, not collapse immediately to strings or ambient Promise rejection semantics
- `finally` must still run on normal completion and exceptional completion

To keep the first shipped slice reviewable, the safest initial semantic boundary is:

- allow `await` inside `try` and `catch`
- keep `await` inside `finally` as a separate later slice unless the state-machine lowering cleanly supports it from the start

That gives the first implementation a simpler contract:

- protected regions survive suspension through the async frame
- catch bindings remain part of async-frame-managed state when needed
- `finally` retains its cleanup guarantee without forcing the very first async lowering to solve nested suspension inside finalizers

## Planned Build Order

The intended implementation order is:

1. define the first supported async surface
2. define a Jayess-native async result model
3. define suspension-safe lifetime rules
4. define lowering strategy in generated C++
5. add parser legality rules and AST support
6. add focused runtime helpers and tests
7. add Jayess-written async core modules on top of those primitives

The preferred architecture is not “all async support directly in C++.”

Instead, aim for:

- minimal C++ primitives for async result storage or scheduling only where necessary
- Jayess-written core-library modules for higher-level async behavior when the primitives exist

## Jayess-Owned Async Core Module Surface

The first async implementation should introduce a repository-owned Jayess async module surface instead of ambient JavaScript `Promise` globals.

The preferred module identity is:

- `jayess:async`

That module should be treated as:

- an ordinary Jayess-owned core module in the module graph
- explicit import surface, not ambient global behavior
- the home for higher-level async combinators layered over the primitive async-result runtime

This keeps the language model explicit:

- `async function` creates Jayess async handles
- `await` consumes Jayess async handles
- higher-level composition lives in `jayess:async`

## First Jayess Async Library API Shape

The first `jayess:async` module should stay narrow and centered on composition over async handles, not on JavaScript compatibility.

The first API shape should be:

- `resolved(value)`
  returns an already-completed Jayess async handle
- `rejected(error)`
  returns an already-failed Jayess async handle
- `all(handles)`
  combines an array of Jayess async handles into one async handle that resolves when all inputs resolve
- `race(handles)`
  combines an array of Jayess async handles into one async handle that completes when the first input completes
- `isAsync(value)`
  reports whether a value is the Jayess async-result runtime kind

This first shape intentionally avoids shipping a broad JavaScript-like `Promise` surface.

Leave these for later slices unless the runtime implementation proves they are needed immediately:

- `then(...)`
- `catch(...)`
- `finally(...)`
- top-level scheduler control APIs
- ambient global constructors

The design goal is:

- keep language-level `await` as the main consumption path
- keep library composition explicit through `jayess:async`
- avoid coupling Jayess semantics to ambient JavaScript Promise behavior
