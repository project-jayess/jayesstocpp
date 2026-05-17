# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler. Completed milestones through section 85 were moved to `archived-checklist.md` to keep the working checklist small and focused.

See [archived-checklist.md](./archived-checklist.md) for completed baseline and earlier milestone history.

## 86. Remaining Language And Library Buildout

- [x] Create a new implementation milestone policy that treats the remaining language/runtime gaps as active build work.
- [x] Keep explicit parser/semantic diagnostics for not-yet-implemented features until each feature slice is actually shipped.
- [x] Document which remaining slices are expected to land through Jayess-written core modules, C++ runtime primitives, or a mixed approach.
- [x] Add a contributor note that new feature work should prefer Jayess-owned modules over ambient JavaScript/Node emulation.

## 87. Async And Promise System

- [x] Add a focused async architecture doc section that defines the first supported `async` surface.
- [x] Define the runtime representation of an async result in the C++ runtime.
- [x] Define whether the result type is one Jayess async value kind or a wrapper over existing callable/object storage.
- [x] Define suspension-safe lifetime rules for locals and captured bindings across `await`.
- [x] Define how `try` / `catch` / `finally` interact with suspended async frames.
- [x] Add AST support for async function declarations.
- [x] Keep async function expressions and async arrow functions outside the first shipped slice with explicit diagnostics.
- [x] Add parser support for `async function`.
- [x] Add parser support for `await expr`.
- [x] Restrict `await` legality to approved async contexts with focused diagnostics.
- [x] Extend semantic analysis for async-function flags and `await` legality.
- [x] Add runtime primitives for async result storage and scheduling.
- [x] Add backend lowering for async function entry, suspension points, and completion.
- [x] Add backend lowering for `await` with single-evaluation semantics.
- [x] Introduce a Jayess-owned async core module surface instead of ambient `Promise` globals.
- [x] Define the first Jayess async library API shape, such as `jayess:async` or equivalent repo-owned modules.
- [x] Add parser, semantic, runtime, and compile-validation tests for supported async functions.
- [x] Add tests for rejection of unsupported async forms outside the first shipped slice.
- [x] Update overview, limitations, semantics, and library architecture docs after the first async slice lands.

## 88. Generators And Iteration Runtime

- [x] Define the first supported generator surface: `function*`, `yield`, and `yield*` scope.
- [x] Define suspension-safe lifetime behavior for locals, temporaries, and captured bindings across `yield`.
- [x] Define the runtime representation of a generator frame and resumable state.
- [x] Define how generator completion values and yielded values map into Jayess runtime values.
- [x] Add AST support for generator functions.
- [x] Add AST support for `yield` and `yield*`.
- [x] Add parser support for generator declarations and expressions.
- [x] Restrict `yield` legality to generator contexts with focused diagnostics.
- [x] Extend semantic analysis for generator flags and `yield` legality.
- [x] Add backend lowering for generator state machines.
- [x] Add runtime primitives for generator frame storage and resume/next behavior.
- [x] Decide whether the first slice exposes generators through a Jayess-owned iterator module or direct callable protocol.
- [x] Add parser, semantic, runtime, and compile-validation tests for supported generator behavior.
- [x] Update overview, limitations, semantics, and library architecture docs after the first generator slice lands.

## 89. Inheritance And `super`

- [x] Define the first inheritance slice as single inheritance or broader support explicitly.
- [x] Define whether the first slice allows only Jayess class bases.
- [x] Define base-field initialization order relative to derived field initializers and constructor bodies.
- [x] Define `super(...)` constructor-call semantics.
- [x] Define `super.method(...)` lookup and `this` binding semantics.
- [x] Define whether static inheritance is part of the first shipped slice.
- [x] Add AST support for `extends` clauses.
- [x] Add AST support for `super` constructor calls and member lookups.
- [x] Add parser support for derived classes.
- [x] Add semantic validation for legal base classes and legal `super` use sites.
- [x] Add runtime/class-model support for base-class links and method lookup through a base chain.
- [x] Add backend lowering for constructor chaining and inherited method dispatch.
- [x] Add tests for initialization order, `super(...)`, inherited methods, and invalid `super` usage.
- [x] Update overview, limitations, semantics, and class-model docs after inheritance lands.

## 90. Private Members

- [x] Define the first private-member slice: private instance fields only, or fields plus methods/static fields.
- [x] Define private-name identity rules per class.
- [x] Define duplicate private-name validation rules.
- [x] Define how private access behaves across inheritance once inheritance exists.
- [x] Define whether private storage uses hidden runtime keys, class-owned slots, or another explicit mechanism.
- [x] Add AST support for private identifiers and private field declarations.
- [x] Add AST support for private member access expressions.
- [x] Add parser support for `#field` syntax in class bodies and member access.
- [x] Extend semantic analysis for private-name visibility and illegal external access.
- [x] Add runtime support for non-public private storage.
- [x] Add backend lowering that keeps private access separate from ordinary property lookup.
- [x] Add tests for private initialization, same-class access, invalid external access, and duplicate names.
- [x] Update overview, limitations, semantics, and class-model docs after the first private-member slice lands.

## 91. Computed Class Members And Static Initialization Blocks

- [x] Define computed class key evaluation timing.
- [x] Define static initialization block ordering relative to static fields.
- [x] Define how computed keys interact with inheritance and class-side initialization.
- [x] Add AST support for computed class member names.
- [x] Add AST support for static initialization blocks.
- [x] Add parser support for computed class members and static blocks.
- [x] Extend semantic analysis for class-side initialization scope and ordering.
- [x] Add backend lowering for computed key evaluation with deterministic ordering.
- [x] Add backend lowering for static initialization blocks without leaking statements into unrelated scopes.
- [x] Add tests for evaluation order, static initialization order, and invalid forms.
- [x] Update overview, limitations, semantics, and class-model docs after these class features land.

## 92. Jayess Standard Library Modules: `Date`, `JSON`, `Map`, `Set`

- [x] Create a repository-owned built-in module path policy for standard-library modules such as `jayess:date`, `jayess:json`, and `jayess:collections`.
- [x] Define how these modules resolve through the normal Jayess module graph in `transpileFile()`.
- [x] Define how these modules resolve or diagnose in `transpile()` string mode.
- [x] Create a bootstrap directory/layout for Jayess-written standard-library modules inside the repository.

### 92.1 `Date`

- [x] Define the first Jayess date/time API surface.
- [x] Decide which primitives need C++ runtime support and which wrappers can live in Jayess modules.
- [x] Implement the minimal C++ date/time primitive layer if required.
- [x] Implement the first Jayess date module in Jayess source.
- [x] Add compile-validation and API tests for the first `Date` slice.

### 92.2 `JSON`

- [x] Define the first Jayess JSON API surface.
- [x] Decide whether parsing/serialization primitives need C++ runtime support or a small native helper.
- [x] Implement the minimal primitive layer if required.
- [x] Implement the first Jayess JSON module in Jayess source.
- [x] Add compile-validation and API tests for the first `JSON` slice.

### 92.3 `Map`

- [x] Define whether `Map` needs a new runtime value kind or a wrapper over lower-level primitives.
- [x] Define the first Jayess `Map` API surface.
- [x] Implement the minimal C++ primitive layer if required.
- [x] Implement the first Jayess `Map` module in Jayess source.
- [x] Add compile-validation and API tests for the first `Map` slice.

### 92.4 `Set`

- [x] Define whether `Set` needs a new runtime value kind or a wrapper over lower-level primitives.
- [x] Define the first Jayess `Set` API surface.
- [x] Implement the minimal C++ primitive layer if required.
- [x] Implement the first Jayess `Set` module in Jayess source.
- [x] Add compile-validation and API tests for the first `Set` slice.

## 93. Jayess System Modules For Filesystem, Path, And Process

- [x] Define the first Jayess-owned system-module namespace, such as `jayess:fs`, `jayess:path`, and `jayess:process`.
- [x] Define how these modules differ from ambient `node:*` imports.
- [x] Decide which features are pure Jayess wrappers and which require native adapter primitives.
- [x] Add resolver support for approved Jayess system modules.
- [x] Keep raw `node:*` imports rejected with a focused migration diagnostic once Jayess system modules exist.
- [x] Implement the minimal native adapter layer required for the first filesystem/path/process slice.
- [x] Implement the first Jayess system modules in Jayess source where practical.
- [x] Add compile-validation, API, and module-resolution tests for Jayess system modules.
- [x] Update overview, limitations, module-resolution docs, and standard-library docs after the first system-module slice lands.
