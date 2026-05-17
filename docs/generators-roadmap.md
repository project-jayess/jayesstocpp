# Generators Implementation Plan

Jayess does not currently support generators or `yield` end to end, but the feature is planned work rather than indefinite postponement.

The repo now includes syntax and semantic groundwork:

- generator declarations and generator function expressions parse
- `yield expr` and `yield* expr` parse
- `yield` legality is checked against generator-function context
- generator declarations and generator expressions still fail with explicit semantic diagnostics until lowering/runtime support lands
- the shared Jayess runtime now includes a dedicated generator handle kind plus focused frame/resume helpers for later lowering work

This document defines the first shipped generator contract that later runtime and backend work must target.

## First Supported Surface

The first shipped generator slice should stay intentionally narrow:

- support `function* name(...) { ... }` generator declarations
- support `yield expr`
- support `yield* expr`
- support generator calls that return Jayess-owned generator handles
- keep generator function expressions, generator methods, async generators, and generator arrow forms outside the first shipped slice unless later implementation work requires them

The first slice should also keep consumption explicit:

- one Jayess-owned generator handle runtime kind
- one small iterator/generator core module for higher-level helpers
- no ambient JavaScript iterator protocol emulation as a prerequisite for the first slice

## Required Build Areas

Generator support is not just parser work. It would require a coherent answer for:

- suspension-safe storage for locals across `yield`
- interaction between suspended frames and Jayess scope cleanup
- closure capture across suspension points
- resumable state machines in generated C++
- interaction with `try` / `catch` / `finally`
- interaction with any future async/runtime iteration design

The feature should land as a real runtime-backed slice, not as parser-only support.

## Current Repository Rule

The current policy is:

- keep fake generator lowering out of the backend until the runtime model exists
- keep generator declarations blocked with explicit semantic diagnostics until state-machine lowering lands
- keep generator function expressions outside the first shipped slice with explicit diagnostics
- build generators through deliberate state-machine and lifetime work

## Suspension-Safe Lifetime Rules

`yield` creates a suspension boundary, so the first generator slice needs explicit storage rules for locals and captures.

The intended first-slice lifetime rules are:

- any local binding used after a `yield` must move into a heap-backed generator frame
- temporaries fully consumed before the `yield` may still use ordinary local storage and cleanup
- captured outer bindings referenced after suspension must remain reachable through the generator frame or frame-owned environment
- generator-frame cleanup must run exactly once when the generator reaches final completion or final failure
- scope cleanup must not destroy values that are still live across suspension

This mirrors the async rule direction but keeps generator state separate from async-result state.

## Runtime Frame And Resumable State

The first slice should introduce one dedicated runtime generator kind instead of pretending a generator is just an ordinary callable or object.

That runtime shape should include:

- a heap-backed generator-frame object
- one explicit generator status enum, such as:
  - suspended-start
  - suspended-yield
  - completed
  - failed
- one program-counter or state-slot field to identify the next resume point
- storage for yielded value, final completion value, and failure payload
- frame-owned storage for locals that survive across `yield`

The first backend slice should lower generator bodies to explicit resumable state machines over that frame representation.

## Yielded Values And Completion Values

The first slice should keep yielded values and completion values explicit:

- `yield expr` stores one yielded Jayess value in the generator frame and suspends
- generator resumption returns control to the next state-machine block
- falling off the end of a generator or `return expr` stores one final completion value
- thrown failures store one Jayess failure payload on the generator frame

The first runtime contract should therefore distinguish:

- current yielded value
- final completion value
- failure payload

This avoids collapsing generator completion into plain callable return behavior.

## Jayess-Owned Exposure Surface

The first generator slice should expose generators through a Jayess-owned iterator module rather than relying on an ambient JavaScript protocol.

The preferred module identity is:

- `jayess:iter`

The first runtime/backend slice should still produce direct generator handles, but higher-level consumption helpers should live in a Jayess-owned module. That keeps the feature explicit and aligned with the same architecture used for `jayess:async`.

## Planned Build Order

1. define the first supported generator surface
2. define suspension-safe lifetime behavior
3. define generator state storage in generated C++
4. define yielded/completion/failure value mapping
5. decide the Jayess-owned exposure surface for generator helpers
6. add parser support and legality rules
7. add focused lowering and runtime helpers
8. add Jayess-level iterator/generator library helpers where appropriate

## Current Runtime Progress

The runtime now includes the first generator-specific primitive layer:

- one dedicated `generator_state` runtime shape
- one explicit `generator_status` enum
- identity-based Jayess generator handles in the shared `value` variant
- helpers for:
  - creating generator handles
  - checking suspended/completed/failed state
  - storing the next resume slot
  - storing the current yielded/completed/failed value
  - attaching one generated resume function
  - resuming and surfacing failure payloads

This keeps generator work out of the ordinary callable/object path and gives the backend a narrow runtime target for upcoming state-machine emission.

The backend now also lowers declaration-only generator functions through explicit state-slot resume lambdas. The current lowering slice supports:

- generator declarations
- direct `yield expr`
- direct `yield* expr`
- final completion through `return expr` or falling off the end

More complex yield nesting and broader generator forms still belong to later generator slices.
