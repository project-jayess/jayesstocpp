# Jayess Standard Library And Core Model

Jayess does not have to implement every future feature directly as hardcoded C++ runtime behavior.

The preferred long-term architecture is:

1. a **small C++ runtime** for primitive machinery the language cannot express yet
2. a **Jayess-written standard library and higher-level core modules**
3. **user Jayess code** transpiled together with those modules

## Core Principle

When a feature can be expressed safely in Jayess, prefer implementing it in Jayess source.

That Jayess source can then be:

- imported like ordinary Jayess modules
- transpiled together with the user program
- emitted as part of the generated C++ project

This keeps the runtime smaller and makes the language exercise itself.

## What Belongs In C++ Runtime Primitives

Some functionality still needs low-level C++ support first.

Examples:

- `value` representation
- array/object/callable storage
- call dispatch
- closure environment support
- scoped cleanup helpers
- exception carrier support
- hidden storage primitives for private fields
- class links, constructor storage, and base-chain method lookup for inheritance
- async scheduling/result primitives
- generator suspension/state primitives

These are foundations the language cannot bootstrap from Jayess alone.

## What Can Belong In Jayess

Once the primitives exist, higher-level behavior should prefer Jayess source where practical.

Examples:

- helper functions
- standard-library modules
- collection utilities built on arrays/objects or later container primitives
- date/json convenience layers
- higher-level async helpers after async primitives exist
- core-library wrappers that define Jayess-level APIs on top of smaller runtime hooks

## Transpilation Model

The intended model is:

- repository-defined Jayess standard-library/core modules are real Jayess modules
- when imported or otherwise enabled by repository-defined policies, they join the normal module graph
- `transpileFile()` emits them into the generated C++ project together with user code

Current repository decision:

- repository-provided core or standard-library modules should join the graph through the same module-resolution pipeline as other Jayess modules
- explicit import is the default model
- repository-defined opt-in inclusion hooks are allowed later, but implicit ambient inclusion should not be the default behavior

If the repository adopts a built-in-module namespace later, the preferred reserved form is:

- `jayess:*`

Examples:

- `jayess:date`
- `jayess:json`
- `jayess:collections`
- `jayess:async`
- `jayess:iter`
- `jayess:fs`
- `jayess:path`
- `jayess:process`

That namespace must stay distinct from:

- `node:*` for unsupported Node built-ins
- `cpp:*` for compiler-provided C++ standard-library headers
- relative or package Jayess modules

Resolution order should remain deliberate:

1. `cpp:*` native standard-library dependency imports
2. `node:*` explicit unsupported diagnostics unless a future policy changes
3. `jayess:*` repository-provided Jayess core-library modules, if adopted
4. relative Jayess modules
5. package Jayess modules

`transpileFile()` should include any resolved repository-provided Jayess core-library modules in generated output exactly like other Jayess modules:

- emit them only under the target directory
- preserve encoded module identity
- never write back into the source tree
- never bypass normal path-safety guarantees

`transpile(source)` should stay conservative:

- no implicit filesystem reads by default
- no implicit loading of repository-provided core modules by default
- if code references repository-defined core-library modules in string-only mode, resolution should require explicit options or an explicit resolver policy

The current bootstrap filesystem layout for future built-in modules is:

- `stdlib/jayess/date/`
- `stdlib/jayess/json/`
- `stdlib/jayess/collections/map/`
- `stdlib/jayess/collections/set/`
- `stdlib/jayess/fs/`
- `stdlib/jayess/path/`
- `stdlib/jayess/process/`

This is better than treating every feature as:

- a special transpiler-only rewrite, or
- a large opaque runtime pasted into the target directory

## Feature Buildout

This architecture is especially important for larger not-yet-implemented features.

Examples:

- the shipped `async` / `await` slice should not stop at parser-only support
- async buildout should combine small C++ primitives for scheduling/result storage with Jayess-written core modules for higher-level behavior

The same applies to:

- `Promise`-like abstractions
- `Map` / `Set` APIs
- JSON/date helper layers
- future core-library modules

Current repository decision for feature buildout:

- split each larger feature into:
  - **needs C++ primitive first**
  - **can be mostly implemented in Jayess once primitives exist**

Examples of features that likely still need C++ primitives first:

- private fields
- inheritance dispatch beyond the current first slice
- generator suspension/state
- async result or scheduling primitives
- new first-class runtime value kinds for `Map` / `Set`

Current shipped example in this category:

- private instance fields already use C++ runtime hidden-storage primitives, while broader private-member forms remain follow-up work
- computed class member names and static blocks already use C++ runtime-backed class construction and class-side property helpers, while broader static inheritance and richer class-side semantics remain follow-up work

Current planned example in this category:

- `jayess:date` should use a small C++ primitive layer for the date carrier, clock hook, and timestamp conversion paths, while the public module surface stays in Jayess
- `jayess:json` should expose a Jayess-owned module surface first, with a small native parse/stringify helper layer under it
- `jayess:collections/map` should use a dedicated runtime value kind for key identity and insertion-order storage, while the public module surface stays in Jayess
- `jayess:collections/set` should use a dedicated runtime value kind for membership identity and insertion-order storage, while the public module surface stays in Jayess
- `jayess:fs`, `jayess:path`, and `jayess:process` should use Jayess-owned module surfaces over a small set of explicit host adapter primitives

Examples of features that can likely live mostly in Jayess after primitives exist:

- higher-level async helpers
- date/json convenience APIs
- collection helpers
- future core-library wrappers around runtime primitives

The first planned example of this pattern is:

- `jayess:async` for composition helpers over Jayess async handles
- `jayess:iter` for higher-level generator and iterator helpers over Jayess generator handles

## Active Milestone Policy

The remaining language/runtime gaps should be treated as active build work, not as indefinite placeholders.

Repository policy for those gaps:

- keep each remaining feature represented by explicit checklist milestones
- split each feature into parser, semantic, runtime, backend, tests, and docs work where applicable
- keep focused diagnostics for not-yet-implemented forms until the corresponding slice is actually shipped
- replace those diagnostics only when the feature has a real semantic/runtime implementation behind it

This avoids two bad outcomes:

- pretending a parser-only slice means the feature is supported
- letting large remaining features sit in a vague “later” state with no implementation plan

## Ownership By Feature Class

The remaining buildout should be classified deliberately:

### Mostly C++ Primitive First

These features need foundational runtime support before Jayess modules can carry most of the surface:

- async result storage and scheduling
- generator suspension/state storage
- inheritance follow-up work such as static inheritance and broader `super` forms
- private-member hidden storage
- new first-class runtime value kinds if `Map` or `Set` require them

### Mostly Jayess Module First Once Primitives Exist

These features should prefer Jayess-owned modules or wrappers once the primitive layer is ready:

- higher-level async helper APIs
- `Date` module APIs
- `JSON` helper APIs
- collection convenience layers for `Map` / `Set`
- filesystem/path/process library APIs

Current shipped example in this category:

- `jayess:fs`, `jayess:path`, and `jayess:process` now use Jayess-owned module wrappers over a narrow native adapter layer

### Mixed Ownership

Some features require a primitive substrate plus Jayess-facing modules:

- `async` / `await`
- generators and iterator helpers
- `Map`
- `Set`
- system modules such as `jayess:fs`

The default rule is:

- if semantics require new storage, suspension, hidden visibility, or dispatch machinery, start in C++
- if the behavior is mostly API shaping, helper logic, or composition over existing primitives, prefer Jayess modules

## Runtime Boundary Decisions

Some existing runtime behavior should stay in C++ long-term because it is foundational:

- `value` storage and tagging
- call dispatch
- array/object/callable backing storage
- scoped cleanup frames
- exception carrier support

Some higher-level behavior should prefer migration upward into Jayess modules over time when practical:

- convenience built-ins
- library helpers
- core-library wrappers
- future rich standard-library APIs

## Bootstrap Plan

The preferred bootstrap path for a minimal Jayess core library is:

1. keep the current primitive C++ runtime small and stable
2. introduce a repository-owned Jayess core-library location
3. route those modules through ordinary Jayess parsing, analysis, and emission
4. prove they can be emitted with user code through `transpileFile()`
5. move higher-level features into Jayess incrementally only after the primitive hooks exist

## Async Direction

If `async` / `await` is revisited later, the preferred layering is:

1. minimal C++ primitives for async result storage or scheduling
2. Jayess-written core modules for higher-level async APIs
3. source-level `async` / `await` lowering that targets that Jayess-owned system

This keeps async support aligned with Jayess semantics instead of binding the language to ambient JavaScript Promise behavior.

## Generator Direction

The current first generator slice uses:

1. C++ runtime primitives for generator handle storage and resumable state
2. generated C++ state-slot lowering for declaration-only generators
3. a planned Jayess-owned `jayess:iter` layer for higher-level iterator and generator helpers

This keeps the shipped generator core explicit:

- runtime owns suspension storage and current/completion/failure state
- backend owns direct state-machine emission
- higher-level consumption helpers can move into Jayess modules instead of requiring ambient JavaScript iterator protocol behavior

## Contributor Guidance

- default to **Jayess implementation** for higher-level standard-library/core behavior
- use **C++ runtime support** only for primitives that must exist below Jayess
- do not turn every larger feature into a large built-in C++ runtime blob by default
- keep explicit diagnostics for not-yet-implemented features until their real implementation slices land
- prefer Jayess-owned modules over ambient JavaScript/Node emulation for new feature work
- keep the distinction clear between:
  - transpiler implementation in JavaScript
  - low-level generated C++ runtime support
  - Jayess-written standard-library/core modules
  - user Jayess modules
