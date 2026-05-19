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
- do not make ambient JavaScript `Promise` a language dependency or target surface

The first slice should not try to ship every async-shaped form at once.

Keep these for later slices unless they become necessary during implementation:

- async methods or constructors as a separate class-model slice
- top-level `await`
- async generators

This keeps the first implementation compatible with the current transpiler architecture:

- explicit AST and semantic flags
- focused runtime primitives
- Jayess-owned library modules layered above the primitive runtime

## Required Build Areas

`async` / `await` needs more than syntax support. Jayess needs a coherent answer for:

- the runtime representation of an async result
- the Jayess-specific abstraction used for async results and composition
- suspension and resumption points in generated C++
- lifetime behavior for locals captured across suspension
- interaction with `try` / `catch` / `finally`
- interaction with the current scope-based cleanup model

The feature should land as a real language/runtime slice, not as parser-only support.

## Current Repository Rule

The current policy is:

- keep unsupported async forms rejected with explicit diagnostics
- reject `await` outside approved async contexts with explicit diagnostics
- keep async methods, async constructors, and top-level `await` rejected with explicit diagnostics until their own slices are approved
- keep JavaScript Promise semantics and Promise-shaped APIs out of the language
- implement the feature through Jayess-owned runtime and core-library layers

Jayess async follow-up work should continue to treat JavaScript `Promise` as unsupported by design, not as pending compatibility work.

## Next Approved Async Surface

The next approved async syntax slice is:

- async function expressions
- async arrow functions

These two forms should land together because they share the same closure/capture/runtime concerns and should reuse the same async-handle lowering path as async function declarations.

That slice is now implemented end to end:

- the parser accepts both forms
- semantic analysis treats `await` inside them as async-scoped
- capture and escape analysis reuse the ordinary function/arrow machinery
- C++ lowering reuses the existing Jayess async-handle runtime path instead of introducing a second async representation

## Async Methods

Async methods are approved as a separate later slice, not as part of the next standalone async-expression work.

That keeps the next implementation focused on:

- ordinary function expressions
- arrow functions
- closure/lifetime behavior

without mixing in class-model and method-table changes.

There is no active implementation milestone for async methods in the current checklist. They remain a later class-model follow-up rather than current in-flight work.

## Async Constructors

Async constructors remain unsupported by design in the current Jayess direction.

Jayess constructors should continue to behave as synchronous instance-initialization paths. If Jayess later needs async construction ergonomics, that should land through a separate Jayess-native factory pattern or class-side helper model, not through JavaScript-style async constructors.

## Top-Level `await`

Top-level `await` remains out of scope for the next async slice.

The current policy is:

- no top-level `await` support yet
- if it ever lands, it should be module-only
- it must come with an explicit module-initialization ordering model for async dependency graphs

That means module-level async initialization is a separate later milestone, not part of the next async-expression implementation slice.

There is no active implementation milestone for that module-level async-initialization work while top-level `await` remains unsupported.

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

The first `jayess:async` module now ships as a narrow composition layer over async handles, not as JavaScript compatibility.

The first shipped API shape is:

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

The approved first composition semantics are:

- `resolved(value)` returns an already-resolved Jayess async handle
- `rejected(error)` returns an already-failed Jayess async handle
- `all(handles)` resolves when all inputs resolve and fails on the first failure
- `race(handles)` completes with the first input completion, whether resolved or failed

This first shipped composition surface uses function exports, not handle methods.

This first shape intentionally avoids shipping any JavaScript `Promise` surface.

Keep these out unless Jayess later defines a distinct Jayess-owned async-composition reason for them:

- `then(...)`
- `catch(...)`
- `finally(...)`
- top-level scheduler control APIs
- ambient global constructors

The design goal is:

- keep language-level `await` as the main consumption path
- keep library composition explicit through `jayess:async`
- avoid coupling Jayess semantics to ambient JavaScript Promise behavior or Promise-first programming style

The remaining section-100 follow-up work should therefore stay focused on verification and any strictly minimal runtime refinement rather than widening into Promise-shaped compatibility.
