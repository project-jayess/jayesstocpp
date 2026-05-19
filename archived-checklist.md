# Jayess to C++ Transpiler Checklist

This file archives completed milestones that were moved out of the active [checklist.md](./checklist.md) to keep the working roadmap small and focused.

This checklist turns the architecture and constraints from `Agents.md` into small implementation tasks for building the first usable version of the Jayess transpiler.

The repository is currently close to empty, so the checklist starts with minimal vertical slices and then expands stage by stage. Keep changes incremental and behavior-preserving.

Completed milestones through section 112 now live here.

## 0. Project Baseline

- [x] Confirm the package root API contract stays `import { transpile, transpileFile } from "jayesstocpp"`.
- [x] Create `src/index.js` and export `transpile` and `transpileFile`.
- [x] Create `src/api/transpile.js`.
- [x] Create `src/api/transpile-file.js`.
- [x] Add a minimal test runner script to `package.json`.
- [x] Add a `test/` directory.
- [x] Add a `fixtures/` directory for Jayess source samples.
- [x] Add a `dev-agent/` directory if agent scratch files are needed.
- [x] Decide and document the minimum supported Node.js version.
- [x] Expand `README.md` with current scope, non-goals, and usage examples.

## 1. Repository Layout

- [x] Create `src/lexer/`.
- [x] Create `src/parser/`.
- [x] Create `src/ast/`.
- [x] Create `src/semantic/`.
- [x] Create `src/lifetime/`.
- [x] Create `src/modules/`.
- [x] Create `src/cpp/`.
- [x] Create `src/runtime/`.
- [x] Create `src/output/`.
- [x] Create `test/api/`.
- [x] Create `test/lexer/`.
- [x] Create `test/parser/`.
- [x] Create `test/semantic/`.
- [x] Create `test/lifetime/`.
- [x] Create `test/modules/`.
- [x] Create `test/cpp/`.
- [x] Create `test/output/`.

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

## 94. Core Value Model And Strict `null`

- [x] Record the permanent language decision that Jayess does not add a separate JavaScript-style `undefined` value.
- [x] Record the permanent language decision that `null` is the only built-in missing-value sentinel.
- [x] Define exact truthiness rules for `null`, empty strings, empty arrays, empty objects, and numeric zero as explicit Jayess semantics.
- [x] Define exact equality rules for `null`, including that `null` does not compare equal to `false`, `0`, or the empty string.
- [x] Define how omitted arguments, missing object properties, missing array elements, and falling off functions without explicit return map onto `null`.
- [x] Update property/index lookup helpers to return `null` consistently where the language intends a missing-value result.
- [x] Update optional chaining and nullish-coalescing lowering to follow the locked `null`-only contract consistently.
- [x] Update function-return lowering so implicit returns follow the locked `null` rule consistently.
- [x] Add runtime, semantic, and compile-validation tests for the locked null-only value model.
- [x] Update `docs/semantics.md`, `docs/overview.md`, `docs/limitations.md`, `docs/javascript-feature-gaps.md`, and `Jayess.md` after the null-only rule is fully implemented end to end.

## 95. Destructuring Expansion

- [x] Define the next supported destructuring surface explicitly: nested patterns, pattern defaults, assignment destructuring, and `for`-initializer destructuring as separate sub-slices.
- [x] Define array nested-pattern semantics, including missing-element behavior and rest binding interaction.
- [x] Define object nested-pattern semantics, including missing-property behavior and aliasing interaction.
- [x] Define default-value semantics inside patterns, including single-evaluation rules.
- [x] Add AST support for nested destructuring patterns without widening unrelated binding forms.
- [x] Extend parser support for nested array/object patterns in declarations.
- [x] Extend parser support for default values inside declaration patterns.
- [x] Extend parser support for assignment destructuring as its own explicit node shape or lowering path.
- [x] Extend parser support for destructuring in `for` initializers.
- [x] Extend semantic analysis for nested binding introduction, duplicate-name rejection, and use-before-declaration interactions.
- [x] Extend lowering/runtime helpers so nested destructuring still evaluates the initializer exactly once.
- [x] Add parser, semantic, runtime, and compile-validation tests for each destructuring sub-slice.
- [x] Update docs after each destructuring sub-slice lands instead of treating destructuring as one giant feature.

## 96. Async Surface Expansion

- [x] Define whether async function expressions are the next approved async syntax slice.
- [x] Define whether async arrow functions are approved separately from async function expressions.
- [x] Define whether async methods are approved separately from standalone async functions.
- [x] Define whether async constructors remain permanently unsupported or gain a Jayess-native alternative.
- [x] Define whether top-level `await` is supported only in module mode and what that means for module initialization ordering.
- [x] Add AST/parser support for async function expressions.
- [x] Add AST/parser support for async arrow functions.
- [x] Add AST/parser support for async methods if approved.
  No active implementation work is scheduled here because async methods remain a separate later class-model slice rather than an approved current milestone.
- [x] Extend semantic analysis so `await` legality follows the new async contexts exactly.
- [x] Extend closure/lifetime analysis for captures inside async function expressions and async arrows.
- [x] Extend lowering for async function expressions and async arrows without duplicating function/closure machinery.
- [x] Define and implement module-level async initialization behavior if top-level `await` is approved.
  No active implementation work is scheduled here because top-level `await` remains unsupported and module-level async initialization remains deferred.
- [x] Add parser, semantic, runtime, and compile-validation tests for each new async context separately.
- [x] Update `jayess:async` docs and module surface notes after the next async slice lands.

## 97. Generator Surface Expansion

- [x] Define whether generator function expressions are the next approved generator slice.
- [x] Define whether generator methods land separately from generator function expressions.
- [x] Define whether async generators are a separate later milestone instead of being bundled into generator follow-up work.
- [x] Define broader supported `yield` positions beyond the current direct declaration-body forms.
- [x] Add AST/parser support for generator function expressions if approved.
- [x] Add AST/parser support for generator methods if approved.
  No active implementation work is scheduled here because generator methods remain a separate later class-model slice rather than an approved current milestone.
- [x] Extend semantic analysis so `yield` legality follows the new generator contexts exactly.
- [x] Extend lowering so generator function expressions reuse the current generator-frame/runtime model instead of creating a second implementation path.
- [x] Extend lowering/runtime behavior for the newly approved `yield` positions with explicit state-slot rules.
  No active implementation work is scheduled here because broader `yield` positions beyond the current direct forms remain deferred.
- [x] Add parser, semantic, runtime, and compile-validation tests for each new generator context separately.
- [x] Update docs after the next generator slice lands.

## 98. Class System Follow-Up

- [x] Define whether static inheritance is approved for Jayess classes and keep it separate from instance-side inheritance.
- [x] Define whether computed `super[expr]` lookup is part of the next inheritance slice.
- [x] Define whether `super` property assignment forms are supported or permanently excluded.
- [x] Define whether non-identifier/non-local base expressions remain rejected or gain a narrow approved form.
- [x] Define the next private-member slice explicitly: private methods, private static fields, and private static methods as separate tasks.
- [x] Define whether static blocks gain a special class-side `this` binding or keep ordinary class-name access only.
- [x] Add AST/parser support for the approved next private-member forms.
- [x] Extend semantic analysis for private method visibility, duplicate-name interaction, and inheritance behavior.
- [x] Extend runtime/class-model support for the approved static-inheritance and private-member forms.
- [x] Extend lowering for static inheritance and approved `super` follow-up forms without breaking the current class method-table model.
  No additional lowering work is active here because static inheritance and broader `super` follow-up forms are still unapproved.
- [x] Add parser, semantic, runtime, and compile-validation tests for each class-system follow-up slice.
- [x] Update class-model docs after each class-system follow-up slice lands.

## 99. Standard Library Breadth: Arrays, Strings, Objects, And Numbers

- [x] Define the next approved array method family explicitly instead of “many methods”: choose one small slice such as `shift` / `unshift`, `slice`, or `includes`.
- [x] Define the next approved string method family explicitly instead of “many methods”: choose one small slice such as `endsWith`, `includes`, `indexOf`, or `trim`.
- [x] Define whether `Object.keys`, `Object.values`, and `Object.entries` are exposed as Jayess-owned modules, runtime-recognized built-ins, or both.
- [x] Define whether `parseInt` and `parseFloat` land as global helpers, `jayess:number` exports, or another explicit module surface.
- [x] Add the chosen array runtime helpers one family at a time.
- [x] Add the chosen string runtime helpers one family at a time.
- [x] Add the chosen object helper surface through Jayess-owned modules or focused runtime hooks.
- [x] Add the chosen numeric parsing helper surface through Jayess-owned modules or focused runtime hooks.
- [x] Extend semantic analysis so unsupported built-in names still fail with focused diagnostics.
- [x] Add parser, semantic, runtime, API, and compile-validation tests for each built-in family slice separately.
- [x] Update overview, limitations, and built-in docs after each family slice lands.

## 100. Jayess Async Composition Surface

- [x] Record the permanent language decision that Jayess does not expose JavaScript `Promise` as a language/runtime surface.
- [x] Define the next `jayess:async` composition surface explicitly through Jayess-owned APIs only.
- [x] Define which first additional exports exist beyond the current slice, such as `resolved`, `rejected`, `all`, `race`, chaining helpers, or settle/introspection helpers.
- [x] Define whether chaining uses function exports, handle methods, or another Jayess-owned shape.
- [x] Define rejection-propagation semantics across Jayess async handles and Jayess-owned composition helpers.
- [x] Define whether `catch` and `finally`-style async composition belong in the next Jayess async slice or a later one.
- [x] Add runtime primitives only where the current async handle model is insufficient for Jayess-owned composition.
- [x] Implement the approved next async-composition surface in Jayess modules where practical.
- [x] Add compile-validation and runtime tests for async composition ordering and failure propagation.
- [x] Update async/module docs after the next composition slice lands.

## 101. Regular Expressions

- [x] Decide whether Jayess `RegExp` support is approved at all and whether it belongs in a Jayess-owned module rather than an ambient global.
- [x] Define the first regex surface explicitly: literal syntax, constructor-style creation, or module helpers only.
- [x] Define the minimum supported operations explicitly: `test`, `exec`, `match`-style helpers, and replacement support as separate tasks.
- [x] Decide whether regex support uses a narrow C++ native helper layer, a runtime value kind, or a Jayess wrapper over native primitives.
- [x] Add lexer/parser support only if regex literal syntax is approved.
  No active implementation work is scheduled here because regex literals remain outside the approved first Jayess regex slice.
- [x] Add runtime/native helper support for the approved regex slice.
- [x] Implement the approved first regex module surface in Jayess source where practical.
- [x] Add parser, semantic, runtime, API, and compile-validation tests for the approved regex slice.
- [x] Update docs after the first regex slice lands.

## 102. Standard-Library Expansion: `Date`, `JSON`, `Map`, And `Set`

- [x] Define the next `jayess:date` slice explicitly: formatting, component extraction, arithmetic, timezone policy, and parsing as separate tasks.
- [x] Define the next `jayess:json` slice explicitly: pretty-print options, reviver/replacer-like behavior, and failure diagnostics as separate tasks.
- [x] Define the next `jayess:collections/map` slice explicitly: iteration helpers, bulk construction, and update helpers as separate tasks.
- [x] Define the next `jayess:collections/set` slice explicitly: iteration helpers, bulk construction, and set-operations helpers as separate tasks.
- [x] Add the approved next primitive/runtime support only where the current first-slice helpers are insufficient.
- [x] Implement the approved next module-level helpers in Jayess source where practical.
- [x] Add API, runtime, module-resolution, and compile-validation tests for each next stdlib slice separately.
- [x] Update stdlib docs after each next built-in module slice lands.

## 103. Jayess System Modules Expansion

- [x] Define the next approved `jayess:fs` surface explicitly: file removal, directory listing, rename/move, and stat-like inspection as separate tasks.
- [x] Define the next approved `jayess:path` surface explicitly: resolve, relative, and absolute checks as separate tasks.
- [x] Define the next approved `jayess:process` surface explicitly: argv access, env mutation policy, process spawning policy, and exit behavior as separate tasks.
- [x] Decide whether additional Jayess-owned modules such as `jayess:os`, `jayess:url`, or `jayess:timers` are approved and keep them as separate slices.
- [x] Add the minimal native adapter primitives needed for the approved next system-module slice.
- [x] Implement the approved next Jayess system-module wrappers in Jayess source where practical.
- [x] Keep raw `node:*` imports rejected unless a specific Jayess-owned replacement exists and is documented.
- [x] Add module-resolution, API, runtime, and compile-validation tests for each next system-module slice separately.
- [x] Update system-module docs after each new slice lands.

## 104. Module And Export Semantics Hardening

- [x] Define whether `export *` should continue excluding default exports permanently or gain a Jayess-defined forwarding rule.
- [x] Define whether package `exports` edge cases and conditional export branches need broader resolver support.
- [x] Define how module cycles interact with async initialization if top-level `await` is later approved.
- [x] Tighten package-resolution diagnostics for invalid Jayess packages versus invalid JavaScript packages.
- [x] Add explicit tests for mixed re-export graphs, duplicate export names, and package-entry edge cases.
- [x] Add compile-validation coverage for larger multi-module fixture graphs.
- [x] Update module-resolution docs after the next hardening slice lands.

## 105. Diagnostics, Semantics, And Runtime Hardening

- [x] Tighten truthiness semantics across all current runtime value kinds and record the final rule in `docs/semantics.md`.
- [x] Tighten equality semantics across composites, callables, async handles, generator handles, maps, and sets.
- [x] Decide whether any numeric coercions remain intentionally absent permanently and document that explicitly.
- [x] Improve unsupported-feature diagnostics so intentionally unsupported-by-design features are clearly distinguished from not-yet-implemented slices.
- [x] Expand runtime-semantics tests to cover empty composite truthiness, equality identity, optional chaining, nullish behavior, and exception bridging edge cases.
- [x] Add larger compile-validation fixtures that combine async, generators, classes, modules, and stdlib usage in one project.
- [x] Update docs once the tightened semantic/runtime rules are locked.

## 2. Public API Skeleton

- [x] Implement `transpile(source, options?)` as a synchronous function.
- [x] Validate that `source` is a string.
- [x] Normalize `options` to an object.
- [x] Return a deterministic placeholder C++ string initially.
- [x] Keep `transpile()` free of filesystem writes.
- [x] Implement `transpileFile(entryFilename, targetDirname, options?)` as a synchronous function.
- [x] Validate that `entryFilename` is a non-empty string.
- [x] Validate that `targetDirname` is a non-empty string.
- [x] Normalize `options` to an object in `transpileFile()`.
- [x] Ensure `transpileFile()` creates the target directory if missing.
- [x] Ensure `transpileFile()` never writes outside the target directory.
- [x] Add a minimal API test that imports the package root.
- [x] Add a minimal API test that checks `transpile` is a function.
- [x] Add a minimal API test that checks `transpileFile` is a function.

## 3. Diagnostics Foundation

- [x] Define a consistent diagnostic object shape.
- [x] Include `phase` on diagnostics.
- [x] Include `message` on diagnostics.
- [x] Include `filename` when available.
- [x] Include line and column when available.
- [x] Include related import path when relevant.
- [x] Decide whether recoverable diagnostics are returned or thrown.
- [x] Add a helper for creating syntax diagnostics.
- [x] Add a helper for creating semantic diagnostics.
- [x] Add a helper for creating module-resolution diagnostics.
- [x] Add tests that assert diagnostics are structured and deterministic.

## 4. Source Text and Locations

- [x] Add a source file abstraction that stores filename and full text.
- [x] Add line-start indexing for line and column lookup.
- [x] Add a utility to convert offsets to line and column.
- [x] Add tests for location mapping.

## 5. Lexer MVP

- [x] Define token kinds for identifiers.
- [x] Define token kinds for numeric literals.
- [x] Define token kinds for string literals.
- [x] Define token kinds for punctuation.
- [x] Define token kinds for operators needed by the MVP grammar.
- [x] Define token kinds for keywords `var`, `const`, `function`, `return`, `if`, `else`, `import`, `export`.
- [x] Define token kinds for `default`, `from`, and `as`.
- [x] Implement whitespace skipping.
- [x] Implement line comment skipping.
- [x] Decide whether block comments are in MVP and implement if yes.
- [x] Implement identifier lexing.
- [x] Implement decimal integer lexing.
- [x] Implement string literal lexing for quoted strings.
- [x] Emit EOF token.
- [x] Preserve token ranges.
- [x] Reject unsupported characters with clear diagnostics.
- [x] Add lexer tests for each token category.
- [x] Add lexer tests for comment skipping.
- [x] Add lexer tests for invalid characters.

## 6. AST Foundation

- [x] Define AST node shapes for `Program`.
- [x] Define AST node shapes for `Identifier`.
- [x] Define AST node shapes for literals.
- [x] Define AST node shapes for `VariableDeclaration`.
- [x] Define AST node shapes for `VariableDeclarator`.
- [x] Define AST node shapes for `BlockStatement`.
- [x] Define AST node shapes for `ExpressionStatement`.
- [x] Define AST node shapes for `ReturnStatement`.
- [x] Define AST node shapes for `FunctionDeclaration`.
- [x] Define AST node shapes for `CallExpression`.
- [x] Define AST node shapes for `BinaryExpression`.
- [x] Define AST node shapes for `IfStatement`.
- [x] Define AST node shapes for `ImportDeclaration`.
- [x] Define AST node shapes for `ExportNamedDeclaration`.
- [x] Define AST node shapes for `ExportDefaultDeclaration`.
- [x] Define AST node shapes for `ExportAllDeclaration`.
- [x] Store source ranges on every node.

## 7. Parser MVP

- [x] Build a parser entry point that consumes lexer tokens.
- [x] Parse top-level statements.
- [x] Parse block statements.
- [x] Parse `var` declarations.
- [x] Parse `const` declarations.
- [x] Enforce initializer requirement for `const`.
- [x] Parse expression statements.
- [x] Parse return statements.
- [x] Parse function declarations.
- [x] Parse parameter lists.
- [x] Parse call expressions.
- [x] Parse primary expressions.
- [x] Parse parenthesized expressions.
- [x] Parse basic binary expressions with precedence.
- [x] Parse `if` / `else`.
- [x] Parse empty import `import "./x.js";`.
- [x] Parse named imports.
- [x] Parse default imports.
- [x] Parse import aliases with `as`.
- [x] Parse named exports.
- [x] Parse `export default`.
- [x] Parse re-exports from another module.
- [x] Produce syntax diagnostics with location data.
- [x] Add parser tests for each supported statement type.
- [x] Add parser tests for malformed input.

## 8. Language Rules MVP

- [x] Reject `let` with a Jayess-specific diagnostic.
- [x] Reject JavaScript-style `var` assumptions such as use-before-declaration if unsupported.
- [x] Treat `var` as block-scoped in semantic analysis.
- [x] Require `const` initialization.
- [x] Reject reassignment to `const`.
- [x] Reject duplicate declarations in the same scope unless language rules explicitly allow them.
- [x] Add tests for block-scoped `var`.
- [x] Add tests for `const` reassignment failure.
- [x] Add tests that `let` is rejected.

## 9. Scope and Symbol Binding

- [x] Add a lexical scope model.
- [x] Distinguish module scope from block scope.
- [x] Distinguish function scope frame behavior from binding visibility rules.
- [x] Add symbol records for declarations.
- [x] Bind `var` declarations into the nearest block scope.
- [x] Bind `const` declarations into the nearest block scope.
- [x] Bind function declarations.
- [x] Resolve identifier references.
- [x] Track unresolved identifiers.
- [x] Emit diagnostics for undefined identifiers.
- [x] Support shadowing across nested scopes if allowed.
- [x] Emit diagnostics for illegal same-scope redeclarations.
- [x] Add semantic tests for shadowing.
- [x] Add semantic tests for undefined names.

## 10. Module Surface AST and Analysis

- [x] Collect imports for a module.
- [x] Collect exports for a module.
- [x] Represent side-effect imports distinctly from named bindings.
- [x] Represent re-exports distinctly from local exports.
- [x] Represent default exports explicitly.
- [x] Validate that imported local binding names do not collide illegally.
- [x] Validate that exported names exist when required.
- [x] Add tests for import/export collection.

## 11. Lifetime and Escape Analysis MVP

- [x] Define a minimal ownership/lifetime analysis data structure.
- [x] Mark returned values as escaping.
- [x] Mark exported module bindings as escaping.
- [x] Mark captured closure values as escaping once closures exist.
- [x] Distinguish local non-escaping temporaries from escaping values.
- [x] Add tests for return-based escape.
- [x] Add tests for export-based escape.
- [x] Add tests that non-escaping locals stay local.

## 12. C++ Emission MVP for Single Module

- [x] Define a C++ emission context object.
- [x] Define deterministic name mangling for local symbols.
- [x] Define deterministic name mangling for module-level symbols.
- [x] Emit a C++ file prologue.
- [x] Emit required includes.
- [x] Emit a minimal runtime include strategy.
- [x] Emit numeric literals.
- [x] Emit string literals.
- [x] Emit identifiers.
- [x] Emit variable declarations.
- [x] Emit expression statements.
- [x] Emit return statements.
- [x] Emit function declarations.
- [x] Emit call expressions.
- [x] Emit binary expressions for the MVP operator set.
- [x] Emit block statements.
- [x] Emit `if` / `else`.
- [x] Emit module-level initialization shape.
- [x] Keep emission deterministic across repeated runs.
- [x] Add snapshot tests for emitted C++.

## 13. Runtime Support MVP

- [x] Decide the initial runtime value model.
- [x] Create a minimal runtime header.
- [x] Create a minimal runtime implementation file if needed.
- [x] Provide value support for integers or doubles.
- [x] Provide value support for strings if strings are emitted in MVP.
- [x] Provide helper support for function calls if required.
- [x] Provide scope-cleanup helper hooks if needed by emitted code.
- [x] Keep runtime files small and focused.
- [x] Add runtime-related compile tests.

## 14. `transpile(source)` End-to-End

- [x] Wire lexer into parser.
- [x] Wire parser into semantic analysis.
- [x] Wire semantic analysis into lifetime analysis.
- [x] Wire lifetime analysis into C++ emission.
- [x] Return the final emitted C++ string.
- [x] Ensure no filesystem write occurs during `transpile()`.
- [x] Add a test that repeated `transpile()` calls are deterministic.
- [x] Add a test that invalid source produces a clear diagnostic.

## 15. Compiler Validation for `transpile(source)`

- [x] Add a test helper that writes generated C++ into a temp build directory.
- [x] Add a test helper that invokes the available C++ compiler.
- [x] Prefer compile-only validation before linking when enough.
- [x] Capture compiler stdout and stderr for assertion messages.
- [x] Use compiler diagnostics as debugging hints, not as a substitute for proper analysis.
- [x] Add a compile-validation test for a simple constant declaration.
- [x] Add a compile-validation test for a simple function.
- [x] Add a compile-validation test for a simple call expression.
- [x] Add a compile-validation test for a simple conditional.

## 16. Output Path Planning

- [x] Create a planner for generated output paths.
- [x] Encode module identity into generated filenames.
- [x] Prevent collisions between same-basename modules from different directories.
- [x] Normalize path separators for deterministic generated paths.
- [x] Reject path traversal outside the target directory.
- [x] Add path-planning tests.

## 17. `transpileFile()` MVP

- [x] Read the entry file safely.
- [x] Resolve the entry file to an absolute path.
- [x] Parse and analyze the entry module.
- [x] Emit at least one generated C++ file for the entry module.
- [x] Write generated files only under the target directory.
- [x] Return a useful result object or `undefined`, then keep that contract stable.
- [x] Add a test for target directory creation.
- [x] Add a test that source files are not modified.
- [x] Add a test that generated files stay under the target directory.

## 18. Relative Import Resolution

- [x] Support `./` relative imports.
- [x] Support `../` relative imports.
- [x] Resolve extensionful imports first.
- [x] Decide whether extensionless imports are supported and implement intentionally.
- [x] Distinguish Jayess source imports from native artifact imports.
- [x] Reject missing relative modules with clear diagnostics.
- [x] Avoid duplicating work for repeated imports of the same resolved module.
- [x] Add relative import tests.

## 19. Module Graph Traversal

- [x] Build a module graph walker.
- [x] Track visited modules by resolved identity.
- [x] Preserve evaluation order for side-effect imports.
- [x] Detect import cycles.
- [x] Decide whether cycles are supported in MVP or rejected with diagnostics.
- [x] Add tests for repeated imports.
- [x] Add tests for side-effect import ordering.
- [x] Add tests for cycles.

## 20. Package Resolution

- [x] Read `package.json` when resolving package imports.
- [x] Support bare package imports from `node_modules`.
- [x] Support scoped packages such as `@scope/pkg`.
- [x] Resolve package entry points intentionally.
- [x] Decide whether `exports` is supported in MVP and implement intentionally.
- [x] Reject unsupported packages with clear diagnostics.
- [x] Avoid silently treating arbitrary JavaScript packages as valid Jayess modules.
- [x] Add package-resolution tests with fixtures.

## 21. Multi-Module Emission

- [x] Emit one generated translation unit per resolved Jayess module or another clearly documented layout.
- [x] Emit headers when cross-module declarations require them.
- [x] Preserve stable module identities in generated names.
- [x] Prevent duplicate output for already-emitted modules.
- [x] Emit module initialization support if required for imports and exports.
- [x] Add tests for multi-module output shape.

## 22. Import and Export Semantics

- [x] Implement named import binding.
- [x] Implement default import binding.
- [x] Decide whether namespace imports are in MVP and implement intentionally.
- [x] Implement named exports.
- [x] Implement default exports.
- [x] Implement re-exports.
- [x] Implement `export *` if supported, or reject clearly.
- [x] Preserve module identity through re-export chains.
- [x] Add tests for each import/export form.

## 23. Native Header and Source Imports

- [x] Detect `.h`, `.hpp`, `.hh`, `.hxx` imports as native headers.
- [x] Detect `.c`, `.cc`, `.cpp`, `.cxx` imports as native implementation artifacts.
- [x] Detect `cpp:<header>` imports as C++ standard library header dependencies.
- [x] Do not parse native headers as Jayess source.
- [x] Do not parse native implementation files as Jayess source.
- [x] Do not resolve `cpp:<header>` imports through the local filesystem or `node_modules`.
- [x] Emit `#include` lines for imported native headers.
- [x] Emit `#include <header>` lines for `cpp:<header>` imports.
- [x] Carry native implementation files into the generated project output plan.
- [x] Copy or mirror native artifacts only under the target directory.
- [x] Add tests for native header imports.
- [x] Add tests for native source side-effect imports.
- [x] Add tests for `cpp:vector`, `cpp:string`, and `cpp:memory` imports.

## 24. Shared Library Artifact Imports

- [x] Detect `.so` imports as shared-library artifacts.
- [x] Detect `.dylib` imports as shared-library artifacts.
- [x] Detect `.dll` imports as shared-library artifacts.
- [x] Decide whether `.a` and `.lib` are supported now and implement intentionally.
- [x] Require a header or equivalent declaration source for callable symbols.
- [x] Prevent guessing symbols from binary libraries alone.
- [x] Copy, mirror, or record native libraries under the target directory according to project policy.
- [x] Add diagnostics for unsupported library import situations.
- [x] Add tests for library artifact handling.

## 25. Shared-Library-Oriented Project Output

- [x] Decide the minimal generated project shape for code intended to be compiled as a shared library.
- [x] Decide whether export macros are needed in generated headers.
- [x] Decide whether a module entrypoint symbol is needed for external consumers.
- [x] Decide whether helper build metadata should be emitted.
- [x] Keep the transpiler output as source files and support files, not compiled binaries.
- [x] Add tests that validate the generated project layout for shared-library-oriented builds.

## 26. Compiler Validation for `transpileFile()`

- [x] Add a fixture that transpiles to a small generated project.
- [x] Compile the generated project with the available compiler.
- [x] Capture compiler diagnostics for test failures.
- [x] Add a compile-validation test for a single-module transpiled project.
- [x] Add a compile-validation test for a multi-module transpiled project.
- [x] Add a compile-validation test for a project that includes a native header import.
- [x] Add a compile-validation test for a shared-library-oriented generated project if that layout is emitted.

## 27. Closures and Escaping Values

- [x] Decide when closure support enters the roadmap.
- [x] Add AST support for function expressions if closures need them.
- [x] Add semantic capture analysis.
- [x] Represent captured bindings explicitly.
- [x] Promote escaping captured values to longer-lived storage.
- [x] Emit closure environment support in runtime and C++ backend.
- [x] Add regression tests for captured locals surviving scope exit.

## 28. Objects, Arrays, and Richer Values

- [x] Decide MVP scope for arrays.
- [x] Decide MVP scope for objects.
- [x] Decide MVP scope for property access.
- [x] Add AST nodes for new value forms only when needed.
- [x] Extend semantic analysis for new value forms.
- [x] Extend runtime support for new value forms.
- [x] Extend lifetime analysis for container retention and escape behavior.
- [x] Add focused tests for each new value kind.
- [x] Decide where direct use of C++ standard library containers is appropriate versus where Jayess runtime wrappers are required.

## 29. Control Flow Expansion

- [x] Decide MVP support for loops.
- [x] Add parser support for `while` if included.
- [x] Add parser support for `for` if included.
- [x] Add semantic scope behavior for loop bodies.
- [x] Add cleanup correctness for `break`.
- [x] Add cleanup correctness for `continue`.
- [x] Add cleanup correctness for early return from nested scopes.
- [x] Add regression tests for control-flow cleanup paths.

## 30. Classes and Methods

- [x] Decide when class support enters the roadmap.
- [x] Add AST nodes for class declarations.
- [x] Add parsing for methods and constructors.
- [x] Add semantic binding for class names and members.
- [x] Add runtime/back-end strategy for instance storage.
- [x] Add lifetime rules for class-owned values.
- [x] Add emission for classes and methods.
- [x] Add tests for class construction and method calls.

## 31. Error Handling and Unsupported Features

- [x] Maintain a list of intentionally unsupported Jayess features.
- [x] Add clear diagnostics for every unsupported syntax form encountered.
- [x] Add clear diagnostics for unsupported import forms.
- [x] Add clear diagnostics for unsupported native interop cases.
- [x] Add regression tests for unsupported cases so failures stay explicit.

## 32. Determinism and Stability

- [x] Ensure deterministic module traversal order.
- [x] Ensure deterministic symbol naming.
- [x] Ensure deterministic generated file naming.
- [x] Ensure deterministic emitted include order.
- [x] Ensure deterministic diagnostics ordering.
- [x] Add determinism tests for repeated runs on the same input.

## 33. Temporary Files and Build Artifacts

- [x] Keep compiler-validation temp files under `./temp/test-output` according to repository policy.
- [x] If agent scratch files are needed, keep them under `dev-agent/`.
- [x] Decide where generated test build output should live.
- [x] Ensure test cleanup does not remove user files.
- [x] Add tests around output cleanup helpers if those helpers are introduced.

## 34. CI and Developer Workflow

- [x] Add an `npm test` script.
- [x] Add a script for compile-validation tests if separate from unit tests.
- [x] Add a script for snapshot update if snapshots are used.
- [x] Add CI configuration once the test suite exists.
- [x] Ensure CI can find the available compiler or skips compile tests intentionally.
- [x] Separate fast unit tests from slower compiler-validation tests if needed.

## 35. Documentation

- [x] Document current Jayess syntax that is actually supported.
- [x] Document that `var` is block-scoped.
- [x] Document that `let` is unsupported.
- [x] Document the current import/export subset.
- [x] Document native header/source import support.
- [x] Document `cpp:<header>` imports for C++ standard library access.
- [x] Document that standard library imports are compiler-provided native dependencies, not Jayess modules.
- [x] Document shared library artifact import support.
- [x] Document `transpile()` behavior and non-goals.
- [x] Document `transpileFile()` behavior and path-safety guarantees.
- [x] Document compile-validation workflow for contributors.

## 36. First Usable Milestone

- [x] `transpile()` can parse and emit valid C++ for constants, functions, calls, and `if`.
- [x] `transpile()` output passes a focused compiler-validation test.
- [x] `transpileFile()` can emit a small multi-file C++ project.
- [x] Relative imports work for simple fixtures.
- [x] Named exports and named imports work for simple fixtures.
- [x] Basic diagnostics are structured and readable.
- [x] Generated output stays deterministic.
- [x] Tests cover lexer, parser, semantics, module resolution, emission, and compile validation.

## 37. Near-Term Follow-Up Milestone

- [x] Native header imports are usable in generated output.
- [x] Native source imports are carried into generated project output.
- [x] C++ standard library imports such as `cpp:vector` and `cpp:string` are usable in generated output.
- [x] Shared-library artifacts are copied or recorded safely under the target directory.
- [x] Shared-library-oriented generated project layout is documented.
- [x] Compiler-validation tests cover both direct transpile output and generated projects.

## 38. Review Discipline

- [x] Before each feature, identify which pipeline stage is changing.
- [x] Before each feature, add or update the narrowest relevant tests first if practical.
- [x] After each feature, run the relevant unit tests.
- [x] After each C++ emission change, run compile-validation tests.
- [x] After each module-resolution change, run fixture-based graph tests.
- [x] After each lifetime-related change, run escape-analysis regressions.
- [x] Keep each PR or patch focused on one subsystem or one vertical slice.

## 39. Default Exported Declarations

- [x] Support parsing `export default class Name {}` declarations.
- [x] Allow semantic analysis for named default-exported function declarations.
- [x] Allow semantic analysis for named default-exported class declarations.
- [x] Preserve local binding visibility for named default-exported declarations.
- [x] Emit `__default_export__` for default-exported function declarations.
- [x] Emit `__default_export__` for default-exported class declarations.
- [x] Mark named default-exported declarations as escaping in escape analysis.
- [x] Add parser and semantic tests for default-exported declarations.
- [x] Add compile-validation coverage for generated projects importing default-exported declarations.
- [x] Update contributor docs to describe default-exported declarations support.

## 40. Member Assignment

- [x] Accept object property assignment in semantic analysis.
- [x] Accept array index assignment in semantic analysis.
- [x] Preserve `const` reassignment diagnostics for identifier assignment.
- [x] Mark values assigned into object or array members as escaping in the conservative lifetime model.
- [x] Add focused API tests for emitted member assignment helpers.
- [x] Add semantic and escape-analysis tests for member assignment.
- [x] Add compile-validation coverage for member assignment output.
- [x] Update contributor docs to describe current member assignment support.

## 41. Anonymous Default-Exported Functions

- [x] Parse `export default function(...) {}` as an anonymous default-exported callable.
- [x] Preserve existing named-function-expression restrictions outside this export-default form.
- [x] Accept anonymous default-exported functions in semantic analysis without introducing a local binding.
- [x] Emit anonymous default-exported functions through the existing callable runtime path.
- [x] Add parser and semantic tests for anonymous default-exported functions.
- [x] Add compile-validation coverage for imported anonymous default-exported functions.
- [x] Update contributor docs and limitations for anonymous default-exported function support.

## 42. Anonymous Default-Exported Classes

- [x] Parse `export default class {}` as an anonymous default-exported class.
- [x] Preserve existing named class declaration behavior outside this export-default form.
- [x] Accept anonymous default-exported classes in semantic analysis without introducing a local binding.
- [x] Emit anonymous default-exported classes through the existing class factory runtime path.
- [x] Add parser and semantic tests for anonymous default-exported classes.
- [x] Add compile-validation coverage for imported anonymous default-exported classes.
- [x] Update contributor docs and limitations for anonymous default-exported class support.

## 43. Named Function Expressions

- [x] Parse `function name(...) {}` in expression position as a named function expression.
- [x] Preserve local self-binding visibility only within the named function expression body.
- [x] Keep named function-expression bindings out of the outer containing scope unless assigned normally.
- [x] Reuse the existing closure runtime path for named function expressions.
- [x] Add parser, semantic, and escape-analysis tests for named function expressions.
- [x] Add compile-validation coverage for named function-expression output.
- [x] Update contributor docs and limitations for named function-expression support.

## 44. Class Field Declarations

- [x] Parse instance field declarations in class bodies.
- [x] Support optional field initializers for instance fields.
- [x] Preserve current rejection of `static` class members.
- [x] Allow `this` inside field initializers during semantic analysis.
- [x] Emit instance field initialization through the existing class factory runtime path.
- [x] Mark values assigned through field initializers as escaping in the conservative lifetime model.
- [x] Add parser, semantic, API, and escape-analysis tests for class fields.
- [x] Add compile-validation coverage for class field output.
- [x] Update contributor docs and limitations for class field support.

## 45. Export-All Re-Exports

- [x] Accept `export * from "./mod.js";` in semantic analysis without forcing an unsupported-feature diagnostic.
- [x] Expand `export *` into a computed module export surface for validation.
- [x] Preserve explicit export names alongside export-all surfaces.
- [x] Exclude default exports from `export *` alias generation.
- [x] Emit generated header aliases for `export *` re-exports.
- [x] Add module-graph, semantic, output-shape, and compile-validation tests for `export *`.
- [x] Update contributor docs and limitations for export-all support.

## 46. Static Class Members

- [x] Parse static methods in class bodies.
- [x] Parse static field declarations in class bodies.
- [x] Preserve current rejection of inheritance while allowing the `static` member modifier.
- [x] Allow static members in semantic analysis without breaking instance-member behavior.
- [x] Support property get/set on class callable values in the runtime for static members.
- [x] Emit static methods and static fields onto the class callable value.
- [x] Add parser, semantic, API, and compile-validation tests for static class members.
- [x] Update contributor docs and limitations for static class member support.

## 47. Boolean Literals

- [x] Lex `true` and `false` as Jayess boolean keywords.
- [x] Parse boolean literals in expression position.
- [x] Emit boolean literals through the existing runtime value model.
- [x] Add parser, API, semantic, and compile-validation tests for boolean literals.
- [x] Update contributor docs to describe boolean literal support.

## 48. Null Literals

- [x] Lex `null` as a Jayess literal keyword.
- [x] Parse `null` literals in expression position.
- [x] Represent `null` distinctly in the runtime value model instead of lowering it to a number sentinel.
- [x] Emit `null` literals through the runtime value model.
- [x] Add parser, API, semantic, and compile-validation tests for `null` literals.
- [x] Update contributor docs to describe current `null` support.

## 49. Unary Logical Not

- [x] Lex `!` as a unary-capable operator without breaking existing `!=` handling.
- [x] Parse `!expr` in expression position with the expected precedence relative to calls and binary operators.
- [x] Represent unary logical-not as its own AST node instead of overloading binary expression handling.
- [x] Accept unary logical-not in semantic and lifetime traversal without widening unrelated expression rules.
- [x] Emit unary logical-not through the existing truthiness model.
- [x] Add parser, API, semantic, and compile-validation tests for unary logical-not.
- [x] Update contributor docs to describe current unary operator support.

## 50. Unary Minus

- [x] Parse `-expr` through the existing unary-expression path instead of treating it as a special negative-number token.
- [x] Preserve existing binary subtraction parsing while adding unary minus precedence.
- [x] Reuse the existing unary AST node for unary minus.
- [x] Accept unary minus in semantic and lifetime traversal without widening unrelated expression rules.
- [x] Emit unary minus through the numeric runtime helper path.
- [x] Add parser, API, semantic, and compile-validation tests for unary minus.
- [x] Update contributor docs to describe current unary operator support.

## 51. Logical And/Or

- [x] Lex `&&` and `||` as operators without breaking existing single-character tokenization.
- [x] Parse `&&` and `||` with explicit precedence relative to equality, comparison, additive, and multiplicative operators.
- [x] Reuse the existing binary-expression AST node for logical operators.
- [x] Preserve short-circuit evaluation in generated C++ instead of lowering logical operators to eager helper calls.
- [x] Accept logical operators in semantic traversal without widening unrelated expression rules.
- [x] Conservatively mark returned logical operand values as escaping in lifetime analysis.
- [x] Add parser, API, semantic, escape-analysis, and compile-validation tests for logical operators.
- [x] Update contributor docs to describe current logical operator support.

## 52. Strict Equality Operators

- [x] Lex `===` and `!==` without breaking existing `==`, `!=`, or assignment tokenization.
- [x] Parse strict equality operators with the same precedence tier as current equality operators.
- [x] Reuse the existing binary-expression AST node for strict equality operators.
- [x] Emit `===` and `!==` through the exact-type runtime equality helper path.
- [x] Add parser, API, semantic, and compile-validation tests for strict equality operators.
- [x] Update contributor docs to describe current strict equality support.

## 53. Modulo Operator

- [x] Lex `%` as an arithmetic operator without affecting existing tokenization.
- [x] Parse `%` at the multiplicative precedence tier alongside `*` and `/`.
- [x] Reuse the existing binary-expression AST node for modulo.
- [x] Add a focused numeric runtime helper for modulo.
- [x] Emit `%` through the runtime arithmetic helper path.
- [x] Add parser, API, semantic, and compile-validation tests for modulo.
- [x] Update contributor docs to describe current modulo support.

## 54. Exponentiation Operator

- [x] Lex `**` as an arithmetic operator without breaking `*` tokenization.
- [x] Parse `**` with a higher precedence than multiplicative operators.
- [x] Preserve right associativity for chained exponentiation.
- [x] Reuse the existing binary-expression AST node for exponentiation.
- [x] Add a focused numeric runtime helper for exponentiation.
- [x] Emit `**` through the runtime arithmetic helper path.
- [x] Add parser, API, semantic, and compile-validation tests for exponentiation.
- [x] Update contributor docs to describe current exponentiation support.

## 55. Unary Plus

- [x] Parse `+expr` through the existing unary-expression path.
- [x] Reuse the existing unary-expression AST node for unary plus.
- [x] Add a focused numeric runtime helper for unary plus.
- [x] Emit unary plus through the numeric runtime helper path.
- [x] Add parser, API, semantic, and compile-validation tests for unary plus.
- [x] Update contributor docs to describe current unary plus support.

## 56. Default Parameters

- [x] Define the Jayess semantics for omitted arguments versus explicit `null`.
- [x] Decide whether default parameter initializers evaluate left-to-right like JavaScript.
- [x] Decide whether later default initializers may reference earlier parameters.
- [x] Reject any default-parameter forms that the current runtime model cannot support safely.
- [x] Extend the parser to accept `function f(a = 1) {}` parameter syntax.
- [x] Extend the AST to represent optional parameter initializers explicitly.
- [x] Validate duplicate parameter names under the new parameter shape.
- [x] Preserve current diagnostics for unsupported parameter forms while adding default parameters.
- [x] Lower default parameters into generated function-entry initialization code.
- [x] Keep emitted code deterministic for functions, closures, methods, and constructors.
- [x] Add parser tests for plain defaults, mixed default and non-default parameters, and malformed parameter lists.
- [x] Add semantic tests for parameter visibility inside default expressions.
- [x] Add compile-validation tests for function, method, and constructor default parameters.
- [x] Update overview and limitations docs for default-parameter support.

## 57. Trailing Commas

- [x] Decide which syntactic positions may accept trailing commas in Jayess.
- [x] Start with parameter lists, argument lists, array literals, object literals, import lists, and export lists.
- [x] Keep unsupported trailing-comma positions rejected with clear syntax diagnostics.
- [x] Extend the parser without widening unrelated comma-handling code.
- [x] Preserve deterministic AST shape whether a trailing comma is present or not.
- [x] Add parser tests for accepted trailing commas across each supported construct.
- [x] Add parser tests for rejected trailing commas in unsupported constructs.
- [x] Add compile-validation coverage for representative supported trailing-comma inputs.
- [x] Update contributor docs to describe supported trailing-comma positions.

## 58. Compound Assignment Operators

- [x] Define the initial supported set: `+=`, `-=`, `*=`, `/=`, `%=`, and `**=`.
- [x] Decide whether property/index compound assignment is supported in the first slice or a later slice.
- [x] Extend the lexer to recognize compound assignment tokens without breaking existing operators.
- [x] Extend the parser to represent compound assignment distinctly from binary expressions.
- [x] Preserve current assignment target validation for locals, properties, and indexes.
- [x] Ensure semantic analysis rejects invalid left-hand sides consistently.
- [x] Lower compound assignment through existing arithmetic helper paths where practical.
- [x] Avoid duplicated evaluation of property/index receivers and keys during lowering.
- [x] Add parser tests for local, property, and index compound assignments.
- [x] Add semantic tests for invalid targets and const reassignment behavior.
- [x] Add compile-validation tests for each supported operator family.
- [x] Update contributor docs to describe supported compound assignment behavior.

## 59. Increment And Decrement

- [x] Decide whether Jayess should support both prefix and postfix update expressions.
- [x] Decide whether updates are limited to mutable locals initially or also allow properties/indexes.
- [x] Define returned-value semantics for prefix versus postfix updates.
- [x] Extend the lexer for `++` and `--` without breaking `+` and `-` tokenization.
- [x] Extend the parser with explicit update-expression nodes.
- [x] Reject updates on invalid left-hand sides with focused diagnostics.
- [x] Reject updates on `const` bindings in semantic analysis.
- [x] Lower prefix and postfix updates without double-reading or double-writing the target.
- [x] Keep property/index update lowering isolated if those targets are supported.
- [x] Add parser tests for prefix and postfix local updates.
- [x] Add semantic tests for invalid targets and immutable bindings.
- [x] Add compile-validation coverage for supported update-expression forms.
- [x] Update overview and limitations docs for update-expression support.

## 60. Composite Value Operations

- [x] Define the first read-only standard property surface for arrays and strings, starting with `.length`.
- [x] Decide whether `.length` is exposed as a synthetic runtime property or emitted as a direct helper call.
- [x] Add runtime support for array length queries.
- [x] Add runtime support for string length queries if string property access is introduced.
- [x] Extend property access lowering to recognize supported built-in properties without widening arbitrary property semantics.
- [x] Define a minimal method surface for arrays if introduced, such as `push`.
- [x] Ensure method calls preserve deterministic receiver evaluation order.
- [x] Keep unsupported built-in properties and methods rejected with explicit diagnostics.
- [x] Add semantic and compile-validation tests for supported array/object/string operations.
- [x] Update overview and limitations docs for composite-value operation coverage.

## 61. String And Number Built-Ins

- [x] Define whether built-ins live as runtime methods, synthetic properties, or Jayess standard-library modules.
- [x] Pick a minimal first slice, such as string concatenation helpers already implied plus `toString` and number-to-string formatting.
- [x] Decide whether `parseInt` / `parseFloat` belong in the first slice or a later standard-library layer.
- [x] Keep the initial built-in surface intentionally narrow and documented.
- [x] Add runtime helpers only for the chosen initial built-ins.
- [x] Extend lowering to route supported built-ins through those helpers.
- [x] Reject unsupported built-in calls with clear diagnostics instead of silently generating broken C++.
- [x] Add focused compile-validation tests for each supported built-in.
- [x] Document the supported built-in surface and explicitly list excluded JavaScript built-ins.

## 62. Template Literals And Interpolation

- [x] Decide whether Jayess should support JavaScript-style backtick template literals.
- [x] Decide whether interpolation syntax should be `${expr}` exactly, rather than `{expr}` alone.
- [x] Preserve the rule that quoted strings treat `{name}` as plain text unless template literals are implemented.
- [x] Extend the lexer for backtick-delimited strings only if the feature is accepted.
- [x] Extend the parser to represent literal segments and interpolation expressions distinctly.
- [x] Define runtime lowering for mixed string segments and expression values.
- [x] Decide how template literals interact with escape analysis when interpolated expressions allocate composite values.
- [x] Add parser, semantic, API, and compile-validation tests for supported template-literal forms.
- [x] Add explicit diagnostics for unsupported interpolation forms until the feature lands.
- [x] Update contributor docs to explain that `{someVariable}` inside normal quotes is not interpolation.

## 63. Diagnostics Quality

- [x] Inventory the highest-friction current diagnostics across parser, semantic, module, and backend phases.
- [x] Normalize wording for unsupported-feature diagnostics so they clearly say what is unsupported and where.
- [x] Ensure diagnostics consistently include filename and source location when available.
- [x] Improve malformed import/export diagnostics with specific expected forms.
- [x] Improve operator diagnostics when an operator is syntactically valid but semantically unsupported.
- [x] Improve module-resolution diagnostics for missing package entry files and unsupported package targets.
- [x] Add focused regression tests for improved diagnostic wording and structure.
- [x] Document diagnostic expectations for contributors.

## 64. Module And Output Polish

- [x] Review generated file naming to ensure stable output across repeated runs.
- [x] Review generated directory structure for package imports and scoped packages.
- [x] Ensure native artifact copying remains deterministic when mixed with Jayess modules.
- [x] Add or tighten manifest/dependency-plan output only if it remains small and reviewable.
- [x] Improve shared-library-oriented output docs to clarify expected post-transpile build steps.
- [x] Add regression tests for deterministic file layout and manifest content if manifests are emitted.
- [x] Document current generated-project shape more explicitly for contributors.

## 65. Semantic Tightening

- [x] Audit and document current Jayess truthiness behavior.
- [x] Audit and document current equality behavior for numbers, strings, booleans, null, arrays, objects, and callables.
- [x] Audit and document current numeric-operator domain assumptions.
- [x] Decide which JavaScript coercions Jayess intentionally does not implement.
- [x] Turn implicit current behavior into explicit semantic rules in docs.
- [x] Add focused tests that lock down current truthiness and equality semantics.
- [x] Add focused tests for rejected coercive or ambiguous JavaScript behaviors.
- [x] Update limitations docs to clearly distinguish “unsupported” from “intentionally different.”

## 66. Template Literals And `${...}` Interpolation

- [x] Define Jayess template-literal syntax as backtick-delimited strings using JavaScript-style `${expr}` interpolation.
- [x] Keep `{name}` inside normal single-quoted and double-quoted strings as literal text.
- [x] Decide whether raw newlines are allowed inside template literals in the first implementation slice.
- [x] Decide which escape sequences are supported inside template literal text segments.
- [x] Decide whether tagged templates are out of scope and should fail explicitly.
- [x] Extend the lexer to recognize backtick-delimited template literals without breaking existing quote-string tokenization.
- [x] Decide whether the lexer should emit one template token stream or segment/interpolation boundary tokens.
- [x] Extend the AST with a focused template-literal node that stores ordered literal segments and expression segments.
- [x] Extend the parser to accept `${expr}` interpolation boundaries and preserve source-order segment structure.
- [x] Add parser diagnostics for unterminated template literals and malformed `${...}` expressions.
- [x] Decide whether empty `${}` is a syntax error with a specific diagnostic.
- [x] Define interpolation evaluation order explicitly as left-to-right.
- [x] Decide how non-string interpolated values convert to string in Jayess.
- [x] Add a narrow runtime helper for value-to-string conversion used by interpolation.
- [x] Add a narrow runtime helper for efficient concatenation of template segments.
- [x] Ensure interpolated expressions preserve side effects and are evaluated exactly once.
- [x] Ensure template-literal lowering remains deterministic in emitted C++.
- [x] Traverse template-literal expressions in semantic analysis without widening unrelated expression rules.
- [x] Traverse template-literal expressions in escape analysis so interpolated temporary values are handled conservatively.
- [x] Add parser tests for plain templates, single interpolation, multiple interpolations, and nested expressions.
- [x] Add semantic tests for name lookup inside `${expr}` segments.
- [x] Add API and compile-validation tests for template-literal output.
- [x] Add explicit unsupported diagnostics for tagged templates if they remain out of scope.
- [x] Update overview and limitations docs for template-literal support.

## 67. Arrow Functions

- [x] Define the first supported arrow-function forms, starting with expression-body and block-body variants.
- [x] Decide whether single-parameter arrows without parentheses are supported in the first slice.
- [x] Decide whether default parameters, rest parameters, and destructured parameters are included in the first slice.
- [x] Define `this` semantics for arrow functions as lexical capture rather than method-style binding.
- [x] Define whether `arguments` semantics are out of scope and should fail explicitly.
- [x] Extend the lexer and parser for `=>` without breaking comparison or assignment tokenization.
- [x] Add a focused AST node for arrow functions or extend the callable-expression model safely.
- [x] Parse expression-body arrows separately from block-body arrows while preserving deterministic AST shape.
- [x] Add parser diagnostics for ambiguous parenthesized expressions versus parameter lists.
- [x] Extend semantic analysis to capture outer `this` when arrows appear inside methods or constructors.
- [x] Reuse closure capture analysis for arrow functions where possible.
- [x] Reject unsupported arrow-function forms with clear diagnostics instead of partial lowering.
- [x] Define lowering for expression-body arrows as implicit-return callables.
- [x] Define lowering for block-body arrows through the existing callable runtime path.
- [x] Ensure arrow-function emission preserves lexical `this` and captured bindings.
- [x] Add parser tests for no-arg, one-arg, multi-arg, expression-body, and block-body arrows.
- [x] Add semantic tests for lexical `this` capture and unsupported parameter forms.
- [x] Add compile-validation tests for arrow functions used as locals, returns, and object/class-assigned values.
- [x] Update overview and limitations docs for arrow-function support.

## 68. Destructuring

- [x] Define whether array destructuring, object destructuring, or both are supported in the first slice.
- [x] Start with declaration destructuring before assignment-pattern destructuring.
- [x] Decide whether nested patterns are part of the first slice or a later slice.
- [x] Decide whether default values inside destructuring wait for stable default-parameter support.
- [x] Decide whether rest elements/properties land with the spread/rest milestone.
- [x] Extend the parser to represent array and object binding patterns explicitly.
- [x] Preserve current diagnostics for ordinary identifiers while adding pattern syntax.
- [x] Extend semantic analysis to bind all declared names from a pattern.
- [x] Detect duplicate bindings and invalid pattern targets with clear diagnostics.
- [x] Define lowering for array destructuring through indexed reads.
- [x] Define lowering for object destructuring through property reads.
- [x] Ensure destructuring initializer expressions are evaluated exactly once.
- [x] Ensure property/index reads in destructuring preserve deterministic evaluation order.
- [x] Decide how missing elements/properties behave under Jayess semantics.
- [x] Add parser tests for simple array and object destructuring declarations.
- [x] Add semantic tests for duplicates, shadowing, and invalid patterns.
- [x] Add compile-validation tests for destructuring declarations.
- [x] Update overview and limitations docs for destructuring support.

## 69. Spread And Rest

- [x] Split this feature into distinct slices: call spread, array spread, object spread, rest parameters, and rest bindings.
- [x] Decide that call spread is the realistic first target with the current runtime value model.
- [x] Extend the lexer/parser for `...` without breaking existing `.` tokenization.
- [x] Add focused AST support for call spread and array spread elements.
- [x] Define call spread lowering without duplicating side effects from the spread expression.
- [x] Support call spread through ordinary calls, optional calls, and `new` argument lists with the same helper path.
- [x] Define array spread lowering with deterministic left-to-right evaluation order.
- [x] Reuse the same runtime spread helper for call and array spread over Jayess arrays.
- [x] Add broader AST support for object spread while keeping rest bindings/parameters for a later slice.
- [x] Decide whether rest parameters depend on default-parameter support or can land independently.
- [x] Decide whether object spread is in scope only after richer object runtime helpers exist.
- [x] Define rest-parameter lowering through the callable runtime argument model.
- [x] Define rest binding/destructuring interactions only after destructuring support is stable.
- [x] Reject unsupported rest positions with specific diagnostics while object spread remains supported and bounded.
- [x] Add parser tests for accepted call spread, accepted array spread, and rejected unsupported spread/rest forms.
- [x] Add semantic tests for supported call/array spread and spread-source name resolution.
- [x] Add compile-validation tests for supported call/array spread lowering.
- [x] Update overview and limitations docs for the current spread/rest slice.

## 70. Optional Chaining

- [x] Define whether the first slice supports `obj?.prop`, `obj?.[expr]`, `fn?.(...)`, or only a subset.
- [x] Define short-circuit behavior when the receiver is `null`.
- [x] Decide whether `undefined`-style behavior is modeled directly or whether Jayess uses `null` as the short-circuit sentinel.
- [x] Extend the lexer/parser for `?.` without breaking `?` if ternary is added later.
- [x] Add focused AST support for optional member, optional index, and optional call expressions.
- [x] Preserve exact left-to-right evaluation order and avoid double-evaluating receivers.
- [x] Define lowering that branches once on the receiver and reuses the evaluated value.
- [x] Ensure optional-call lowering preserves callee and argument evaluation order.
- [x] Traverse optional-chain expressions in semantic and escape analysis conservatively.
- [x] Reject unsupported optional-chain combinations with clear diagnostics.
- [x] Add parser tests for each supported optional-chain form.
- [x] Add semantic tests for name lookup and invalid chain targets.
- [x] Add compile-validation tests for optional member, optional index, and optional call output.
- [x] Update overview and limitations docs for optional chaining.

## 71. Nullish Coalescing

- [x] Define Jayess `??` semantics relative to current `null` behavior.
- [x] Decide whether the operator checks only `null` or also future `undefined` if introduced later.
- [x] Define precedence relative to `||`, `&&`, equality, and ternary.
- [x] Extend the lexer/parser for `??` without breaking `?`-based future syntax.
- [x] Reuse the existing binary-expression node only if precedence handling remains clear; otherwise add a focused node.
- [x] Preserve short-circuit evaluation and exact left-to-right semantics.
- [x] Lower `??` through a narrow runtime null-check helper or local emitted branch.
- [x] Ensure the left operand is evaluated exactly once.
- [x] Traverse nullish-coalescing expressions in semantic and escape analysis conservatively.
- [x] Add parser tests for precedence and grouping with logical operators.
- [x] Add semantic tests for ordinary use sites and unsupported combinations if mixing rules are narrowed.
- [x] Add compile-validation tests for nullish coalescing.
- [x] Update overview and limitations docs for `??` support.

## 72. Ternary Conditional Expressions

- [x] Define Jayess support for `condition ? whenTrue : whenFalse`.
- [x] Define precedence relative to `||`, `??`, assignment, and comma if comma expressions are ever added.
- [x] Extend the lexer/parser for `?` and `:` without breaking future optional-chaining syntax.
- [x] Add a focused AST node for conditional expressions.
- [x] Ensure parser diagnostics for missing `:` or incomplete branches are explicit.
- [x] Preserve exact evaluation order: condition first, then exactly one branch.
- [x] Lower ternaries through a small emitted lambda or branch expression that avoids double evaluation.
- [x] Traverse both branches in semantic and escape analysis while preserving control-flow semantics.
- [x] Add parser tests for nesting and precedence.
- [x] Add semantic tests for branch-local name lookup and invalid subexpressions.
- [x] Add compile-validation tests for ternary expressions in return values, assignments, and call arguments.
- [x] Update overview and limitations docs for ternary support.

## 73. Switch Statements

- [x] Define whether Jayess supports JavaScript-style fallthrough or requires explicit non-fallthrough semantics.
- [x] Decide whether the first slice supports only literal `case` labels or arbitrary expressions.
- [x] Decide whether `default` may appear anywhere or only once in canonical position.
- [x] Extend the parser with focused AST nodes for switch statements and case clauses.
- [x] Add parser diagnostics for duplicate `default` clauses and malformed case syntax.
- [x] Define per-clause lexical scope behavior for `var` and `const`.
- [x] Define `break` behavior inside switch separately from loop handling if needed.
- [x] Extend semantic analysis to validate switch clause structure and scoped bindings.
- [x] Define lowering either through chained comparisons or emitted `switch` only where runtime values allow it.
- [x] Avoid broad dynamic runtime dispatch in the first slice.
- [x] Add parser tests for switch with cases, default, fallthrough policy, and clause-local bindings.
- [x] Add semantic tests for duplicate defaults and invalid breaks.
- [x] Add compile-validation tests for supported switch forms.
- [x] Update overview and limitations docs for switch support.

## 74. Do-While Loops

- [x] Define Jayess support for `do { ... } while (cond);`.
- [x] Extend the parser with a focused do-while statement node.
- [x] Add parser diagnostics for missing trailing `while (...)`.
- [x] Reuse existing loop semantic context for `break` and `continue`.
- [x] Ensure condition evaluation happens after the first body execution.
- [x] Lower do-while through direct C++ `do { ... } while (...)` emission where practical.
- [x] Preserve scope-cleanup behavior for `continue`, `break`, and early returns inside the body.
- [x] Add parser, semantic, and compile-validation tests for do-while.
- [x] Update overview and limitations docs for do-while support.

## 75. Try, Catch, Finally

- [x] Define whether Jayess exceptions map to C++ exceptions directly in the first slice.
- [x] Decide whether only `try/catch`, only `try/finally`, or full `try/catch/finally` lands first.
- [x] Define the catch binding model and whether only identifier bindings are supported initially.
- [x] Extend the parser with focused AST nodes for try statements and catch/finally clauses.
- [x] Add parser diagnostics for malformed catch/finally combinations.
- [x] Define scope-cleanup behavior when control leaves a try block by throw, return, break, or continue.
- [x] Extend semantic analysis for catch-scope bindings.
- [x] Define how thrown Jayess values map through the runtime if exceptions are supported.
- [x] Add runtime support only if a narrow, explicit Jayess exception carrier is needed.
- [x] Lower try/catch/finally without bypassing existing scope-cleanup hooks.
- [x] Add parser tests for all supported clause combinations.
- [x] Add semantic tests for catch binding scope and invalid forms.
- [x] Add compile-validation tests for try/catch/finally control flow.
- [x] Update overview and limitations docs for exception handling support.

## 76. Throw Statements

- [x] Define Jayess `throw expr;` semantics independently from full JavaScript error objects.
- [x] Extend the parser with a focused throw-statement node.
- [x] Add parser diagnostics for missing thrown expressions.
- [x] Decide whether thrown values may be any Jayess runtime value or only a narrowed subset.
- [x] Traverse throw expressions in semantic and escape analysis.
- [x] Ensure thrown values are treated conservatively as escaping.
- [x] Lower throw through the chosen exception/runtime carrier model.
- [x] Add parser, semantic, and compile-validation tests for throw statements.
- [x] Update overview and limitations docs for throw support.

## 77. Async And Await

- [x] Decide whether Jayess should support `async` / `await` at all before a Promise/runtime model exists.
- [x] If supported, define whether `async` depends on a Jayess-native async runtime instead of JavaScript Promise semantics.
- [x] Start with a documentation/design slice before parser/runtime implementation lands.
- [x] Extend the parser for `async function` and `await expr` only if the semantic/runtime model is approved.
- [x] Define where `await` is legal and how misuse is diagnosed.
- [x] Define the runtime representation of an async result.
- [x] Define the minimum first implementation strategy for suspension points and record the remaining runtime work.
- [x] Keep explicit diagnostics for `async` / `await` until the full implementation milestone lands.
- [x] Add roadmap docs that explain why async support depends on a larger runtime design.

## 78. Generators

- [x] Decide whether Jayess generators are compatible with the language memory model.
- [x] Define whether generator functions use JavaScript-style `function*` syntax if supported.
- [x] Define whether `yield` and `yield*` are separate roadmap slices.
- [x] Extend the lexer/parser only if the generator runtime model is accepted.
- [x] Define generator state storage and interaction with scope-based lifetime rules.
- [x] Define how captured locals survive across yield suspension points.
- [x] Decide how generators relate to async/runtime iteration design.
- [x] Keep explicit diagnostics for generators until the full implementation milestone lands.
- [x] Document the generator design dependency chain in contributor docs.

## 79. Inheritance, `extends`, And `super`

- [x] Define whether Jayess supports single inheritance only.
- [x] Define whether only class-to-class inheritance is valid in the first slice.
- [x] Define `super(...)` constructor-call semantics.
- [x] Define `super.method(...)` lookup semantics for instance methods.
- [x] Decide whether static inheritance is part of the first slice or a later implementation slice.
- [x] Extend the parser for `extends` clauses and `super` expressions.
- [x] Add focused AST support for base-class references and super calls/lookups.
- [x] Extend semantic analysis to validate base-class names and legal `super` use sites.
- [x] Reject `super` outside derived constructors/methods with clear diagnostics.
- [x] Define class lowering that preserves base initialization order and method lookup.
- [x] Define how inherited fields and methods map through the current class runtime representation.
- [x] Ensure instance creation still preserves deterministic field-initializer and constructor ordering.
- [x] Add parser tests for derived classes and super calls.
- [x] Add semantic tests for invalid super usage and missing base classes.
- [x] Add compile-validation tests for constructor chaining and inherited method calls.
- [x] Update overview and limitations docs for inheritance support.

## 80. Private Class Fields

- [x] Decide whether Jayess uses JavaScript-style `#field` syntax if private fields are supported.
- [x] Define whether private methods and private static fields are separate later slices.
- [x] Extend the lexer/parser for private identifiers only if the feature is accepted.
- [x] Add focused AST support for private field declarations and accesses.
- [x] Define semantic rules for private-name visibility and invalid external access.
- [x] Define whether private fields lower to hidden runtime property keys or generated C++ private storage.
- [x] Ensure private field access remains deterministic and does not leak through ordinary object property lookup.
- [x] Add parser tests for declaration and access syntax.
- [x] Add semantic tests for out-of-class access and duplicate private names.
- [x] Add compile-validation tests for private field initialization and method access.
- [x] Update overview and limitations docs for private-field support.

## 81. Runtime Built-Ins: Date, Promise, Map, Set, JSON

- [x] Decide whether these are true Jayess standard-library modules, runtime global constructors, or Jayess-owned library/runtime features.
- [x] Split the work into separate slices instead of one giant built-ins milestone.
- [x] Define whether `Date` belongs in core language support or a library module layer.
- [x] Define whether `Promise` lands together with the async/await design.
- [x] Define whether `Map` and `Set` require new runtime value kinds or can wrap object/array storage safely.
- [x] Define whether `JSON` should start as a small helper module rather than global object emulation.
- [x] Document the current not-yet-implemented built-ins explicitly.
- [x] Add checklist subsections later for whichever built-ins are approved for real implementation.

### 81.1 Future Slice: `Date`

- [x] Decide whether Jayess date/time support belongs in a `jayess:date`-style module.

### 81.2 Future Slice: `Promise`

- [x] Land `Promise` together with a real Jayess async/await runtime/result model.

### 81.3 Future Slice: `Map`

- [x] Decide whether `Map` needs a new runtime value kind or a standard-library wrapper.

### 81.4 Future Slice: `Set`

- [x] Decide whether `Set` needs a new runtime value kind or a standard-library wrapper.

### 81.5 Future Slice: `JSON`

- [x] Decide whether `JSON` starts as a small helper module rather than a global object.

## 82. Node Built-Ins Inside Jayess Source

- [x] Decide whether Jayess will ever support imports such as `node:fs` or `node:path`.
- [x] If supported, define whether they are compiler-known standard-library modules or adapter-backed native modules.
- [x] Keep the current rule explicit that Node built-ins are not automatically available.
- [x] Add explicit diagnostics for `node:` imports until Jayess-owned system modules exist.
- [x] Document the distinction between transpiler implementation dependencies and Jayess source-language APIs.
- [x] Add a later slice for deliberate Jayess system modules for filesystem/path/process features.

## 83. Broad Array And String Method Coverage

- [x] Decide whether built-in methods are exposed as runtime-recognized property calls or imported standard-library helpers.
- [x] Split array and string coverage into very small method families instead of “support many methods.”
- [x] Prioritize a first array slice such as `push`, `pop`, `length`, and maybe `join`.
- [x] Prioritize a first string slice such as `length`, `slice`, `substring`, and maybe `startsWith`.
- [x] Define method argument semantics narrowly for each chosen method.
- [x] Add runtime helpers one method family at a time.
- [x] Extend lowering one method family at a time without widening arbitrary dynamic method dispatch.
- [x] Reject unsupported method names with focused diagnostics.
- [x] Add compile-validation and semantic tests per method family.
- [x] Update overview and limitations docs after each small method-family slice lands.

## 84. Computed Class Members And Static Blocks

- [x] Decide that computed class member names need class-key evaluation semantics before implementation.
- [x] Decide that static initialization blocks need class-side initialization order before implementation.
- [x] Add explicit parser diagnostics for computed class member names.
- [x] Add explicit parser diagnostics for static initialization blocks.
- [x] Add focused parser regression tests for those diagnostics.
- [x] Document the current rule in overview and limitations docs.

## 85. Jayess Standard Library And Core System Architecture

- [x] Define the repository rule that higher-level standard-library and core behavior should prefer Jayess source when the required primitives already exist.
- [x] Define the repository rule that the C++ runtime should stay focused on primitive machinery Jayess cannot yet express.
- [x] Document the intended split between JavaScript transpiler implementation, C++ runtime primitives, Jayess-written core modules, and user Jayess modules.
- [x] Define how repository-provided Jayess standard-library and core modules join the normal module graph.
- [x] Define whether those modules are imported explicitly, enabled by repository-defined options, or both.
- [x] Define path and naming conventions for built-in Jayess modules such as a future `jayess:*` namespace if the repository adopts one.
- [x] Define how transpile-time resolution distinguishes Jayess core-library modules from Node built-ins and native artifacts.
- [x] Define how `transpileFile()` includes repository-provided Jayess standard-library and core modules in generated output without writing outside the target directory.
- [x] Define how `transpile()` string mode should behave when code references repository-provided Jayess core-library modules.
- [x] Decide which current runtime features should stay in C++ permanently and which should migrate upward into Jayess modules over time.
- [x] Create a focused bootstrap plan for a minimal Jayess core library that can be transpiled with user code.
- [x] Split larger remaining features into “needs C++ primitive first” versus “can be mostly implemented in Jayess”.
- [x] Define an async architecture that prefers Jayess-written core modules once minimal scheduling or result primitives exist.
- [x] Define a library-first strategy for future `Date`, `JSON`, `Map`, and `Set` support rather than ambient globals.
- [x] Add overview, README, contributor docs, and architecture docs for the standard-library and core-system model.

## 106. Regex Expansion

- [x] Define the next approved `jayess:regex` slice explicitly: replacement helpers, flags policy, literal-syntax policy, and result-shape policy as separate tasks.
- [x] Decide whether the next regex slice stays module-only or adds any parser syntax at all.
- [x] Add only the primitive/runtime support needed for the next approved regex helper family.
- [x] Implement the next approved `jayess:regex` helpers in Jayess source where practical.
- [x] Add semantic diagnostics for unsupported ambient/global regex forms that still remain outside the approved slice.
- [x] Add API, runtime, module-resolution, and compile-validation tests for the next regex slice.
- [x] Update regex docs after the next slice lands.

Shipped follow-up: module-only `replaceFirst(regex, text, replacement)` and `replaceAll(regex, text, replacement)` with string replacements only. Regex literals, ambient `RegExp`, flags, callback replacement, and broad string/regex compatibility remain separate later decisions. See [docs/regex-roadmap.md](./docs/regex-roadmap.md) and [docs/jayess-regex-module.md](./docs/jayess-regex-module.md).

## 107. Generator Follow-Up

- [x] Define whether generator methods are the next approved generator slice or remain deferred.
- [x] Define the next approved broader `yield` positions explicitly instead of leaving them as a vague later bucket.
- [x] Define whether `yield` inside `try` / `catch` / `finally` belongs in the next slice or remains deferred.
- [x] Add AST/parser support only for the approved next generator forms.
- [x] Extend semantic analysis so `yield` legality and diagnostics match the approved next generator contexts exactly.
- [x] Extend generator lowering/runtime only for the approved next `yield` positions, keeping one generator-frame model.
- [x] Add parser, semantic, runtime, and compile-validation tests for each generator follow-up sub-slice.
- [x] Update generator docs after the next follow-up slice lands.

Decision: generator methods, broader nested/control-flow `yield`, `yield` inside `try` / `catch` / `finally`, async generators, and generator arrow forms remain deferred. No parser/lowering expansion is active until a later checklist approves one concrete slice, so no code expansion is needed for this checklist section. See [docs/generators-roadmap.md](./docs/generators-roadmap.md).

## 108. Async Follow-Up

- [x] Define whether async methods are the next approved async class-model slice or remain deferred.
- [x] Define whether `await` inside `try` / `catch` / `finally` needs a broader explicit async-lowering slice.
- [x] Define whether any module-level async initialization work becomes active or remains deferred with top-level `await` unsupported.
- [x] Add AST/parser support only for the approved next async forms.
- [x] Extend semantic and lifetime analysis only where the approved next async slice requires it.
- [x] Extend async lowering/runtime only where the approved next async slice requires it, without creating a second async-result model.
- [x] Add parser, semantic, runtime, and compile-validation tests for the next async follow-up slice.
- [x] Update async docs after the next follow-up slice lands.

Decision: async methods and module-level async initialization remain deferred; top-level `await` remains unsupported. `await` in `try` / `catch` is the broader async-lowering direction, while `await` in `finally` remains a separate later slice. No code expansion is needed until a later checklist approves one of those concrete forms. See [docs/async-await-roadmap.md](./docs/async-await-roadmap.md).

## 109. Standard-Library Breadth: Arrays, Strings, Numbers, And Objects

- [x] Define the next approved array helper family explicitly instead of broad “more array methods”.
- [x] Define the next approved string helper family explicitly instead of broad “more string methods”.
- [x] Define the next approved `jayess:number` helper family explicitly instead of ambient/global numeric growth.
- [x] Define the next approved `jayess:object` helper family explicitly instead of broad `Object.*` compatibility.
- [x] Add the approved next array runtime/module helpers one family at a time.
- [x] Add the approved next string runtime/module helpers one family at a time.
- [x] Add the approved next number runtime/module helpers one family at a time.
- [x] Add the approved next object runtime/module helpers one family at a time.
- [x] Extend semantic diagnostics for still-unsupported built-in names and methods.
- [x] Add API, runtime, module-resolution, and compile-validation tests for each built-in family slice separately.
- [x] Update stdlib docs after each family slice lands.

Shipped slices: `array.includes`, string `includes` / `indexOf` / `endsWith`, `jayess:number` `parseInt` / `parseFloat`, and `jayess:object` `keys` / `values` / `entries`. See [docs/standard-library-expansion-roadmap.md](./docs/standard-library-expansion-roadmap.md).

## 110. Built-In Modules Follow-Up: Date, JSON, Map, And Set

- [x] Define the next approved `jayess:date` slice explicitly: formatting expansion, parsing expansion, arithmetic helpers, and timezone policy as separate tasks.
- [x] Define the next approved `jayess:json` slice explicitly: replacement/transform policy, richer validation, and formatting helpers as separate tasks.
- [x] Define the next approved `jayess:collections/map` slice explicitly: bulk construction, bulk updates, and iteration/data helpers as separate tasks.
- [x] Define the next approved `jayess:collections/set` slice explicitly: bulk construction, pure set operations, and iteration/data helpers as separate tasks.
- [x] Add only the primitive/runtime support needed for the approved next built-in-module helpers.
- [x] Implement the approved next module-level helpers in Jayess source where practical.
- [x] Add API, runtime, module-resolution, and compile-validation tests for each new built-in-module slice separately.
- [x] Update built-in module docs after each next slice lands.

Shipped date/json follow-ups are documented. Shipped map/set follow-ups include map `fromEntries` / `setAll` / `deleteAll` and set `fromValues` / `union` / `intersection` / `difference`. See [docs/jayess-date-module.md](./docs/jayess-date-module.md), [docs/jayess-json-module.md](./docs/jayess-json-module.md), [docs/jayess-map-module.md](./docs/jayess-map-module.md), and [docs/jayess-set-module.md](./docs/jayess-set-module.md).

## 111. System Modules Follow-Up

- [x] Define whether `jayess:os`, `jayess:url`, or `jayess:timers` becomes the next approved system-module slice.
- [x] Define the next approved `jayess:fs` helper family explicitly beyond the current file/list/stat slice.
- [x] Define the next approved `jayess:path` helper family explicitly beyond the current path-shaping slice.
- [x] Define the next approved `jayess:process` helper family explicitly, keeping env mutation and subprocess policy separate.
- [x] Add only the minimal native adapter primitives needed for the approved next system-module slice.
- [x] Implement the approved next Jayess system-module wrappers in Jayess source where practical.
- [x] Keep unsupported raw `node:*` and non-approved host APIs rejected with focused diagnostics.
- [x] Add module-resolution, API, runtime, and compile-validation tests for each next system-module slice separately.
- [x] Update system-module docs after each next slice lands.

Shipped follow-ups include `jayess:fs` `remove` / `list` / `rename` / `stat`, `jayess:path` `resolve` / `relative` / `isAbsolute`, and `jayess:process` `argv`. `jayess:os`, `jayess:url`, `jayess:timers`, env mutation, and subprocess spawning remain deferred. See [docs/jayess-system-modules.md](./docs/jayess-system-modules.md).

## 112. Class System And Inheritance Follow-Up

- [x] Define whether private static fields are the next approved private-member slice or remain deferred.
- [x] Define whether private static methods are approved separately from private static fields.
- [x] Define whether static inheritance becomes an active approved slice or remains deferred.
- [x] Define whether any broader `super` forms become active approved slices or remain deferred.
- [x] Add AST/parser support only for the approved next class-system forms.
- [x] Extend semantic analysis only for the approved next private/class/inheritance slice.
- [x] Extend runtime/class-model support only for the approved next forms, keeping one class-chain model.
- [x] Extend lowering only for the approved next forms without broadening unrelated class behavior.
- [x] Add parser, semantic, runtime, and compile-validation tests for each class follow-up slice separately.
- [x] Update class-model docs after each next slice lands.

Decision: private static fields, private static methods, static inheritance, computed `super[expr]`, and `super` assignment remain deferred as separate class-side slices. No parser/runtime/lowering expansion is needed until a later checklist approves one concrete class-side slice. See [docs/private-fields-roadmap.md](./docs/private-fields-roadmap.md) and [docs/inheritance-roadmap.md](./docs/inheritance-roadmap.md).

---

## Archived Completed Active Checklist - 2026-05-19

## 113. Active Feature Buildout

- [x] Implement the next `jayess:regex` flags slice.
- [x] Implement the next generator follow-up slice.
- [x] Implement the next async follow-up slice.
- [x] Implement the next class-system follow-up slice.
- [x] Implement the next system-module follow-up slice.
- [x] Implement the first explicit multi-threading module slice.
- [x] Update docs after each feature slice lands.

## 114. Next Improvement: `jayess:regex` Flags

- [x] Extend `jayess:regex` `create(pattern)` to accept an optional flags string.
- [x] Add a focused regex flag parser in `src/cpp/runtime-regex-source.js`.
- [x] Store regex flags in the existing regex runtime object carrier.
- [x] Support a small first flags set: `i`, `m`, and `s`.
- [x] Reject duplicate or unknown regex flags with focused runtime diagnostics.
- [x] Update `stdlib/jayess/regex/regex-primitives.hpp` and `stdlib/jayess/regex/index.js`.
- [x] Add focused tests under `test/` for runtime source shape, generated output, module resolution, and compile validation.
- [x] Update `docs/jayess-regex-module.md`.

### 114.1 Runtime And Native Bridge Tasks

- [x] Add a hidden regex flags storage key beside the existing hidden regex pattern key.
- [x] Add a small runtime helper that validates a flags string and returns one internal flag representation.
- [x] Map `i` to the C++ regex case-insensitive option.
- [x] Implement `m` behavior in the approved runtime path.
- [x] Implement `s` behavior in the approved runtime path.
- [x] Ensure `create(pattern)` preserves current no-flag behavior.
- [x] Ensure `create(pattern, flags)` validates that `flags` is a string.
- [x] Ensure regex compilation reads both stored pattern and stored flags.
- [x] Add focused runtime error text for duplicate regex flags.
- [x] Add focused runtime error text for unknown regex flags.
- [x] Keep regex value detection through `isRegex(value)` unchanged.
- [x] Keep `test`, `exec`, `replaceFirst`, and `replaceAll` using the shared compiled-regex helper.

### 114.2 Jayess Module Surface Tasks

- [x] Update `stdlib/jayess/regex/regex-primitives.hpp` so `jayessRegexCreate` forwards the optional flags argument.
- [x] Update `stdlib/jayess/regex/index.js` so `create(pattern, ...flags)` remains a thin wrapper with omitted-flag handling.
- [x] Keep all regex helpers as explicit `jayess:regex` exports.
- [x] Keep parser syntax unchanged for this slice.

### 114.3 Regex Flags Tests

- [x] Add or update `test/fixtures/modules/regex-main.js` to import and exercise flagged regex creation.
- [x] Add runtime-source assertions in `test/runtime-semantics.test.js` for flag storage and validation helpers.
- [x] Add generated-output assertions in `test/output/transpile-file.test.js` for regex flag declarations and bridge functions.
- [x] Add module graph coverage in `test/modules/module-graph.test.js` for flagged regex module imports.
- [x] Add compile-validation coverage in `test/cpp/compiler.test.js` for a generated project using flagged regex helpers.
- [x] Add API-level coverage in `test/api/transpile.test.js` for flagged regex imports.

### 114.4 Regex Documentation Tasks

- [x] Update `docs/jayess-regex-module.md` with `create(pattern, flags)` behavior.
- [x] Document the first supported flags and their Jayess semantics.
- [x] Document runtime diagnostics for malformed flags.
- [x] Keep public documentation focused on current behavior.

## 115. Maintainability Improvement: C++ Emitter Split

- [x] Extract built-in member and call emission helpers from `src/cpp/emit-module.js` into `src/cpp/emit-builtins.js`.
- [x] Keep the public `emitModule(...)` API unchanged.
- [x] Preserve generated C++ output for existing snapshot cases.
- [x] Add or update focused tests under `test/` only where behavior coverage is missing.

### 115.1 Extraction Scope Tasks

- [x] Move built-in member recognizers out of `src/cpp/emit-module.js`.
- [x] Move built-in array call renderers out of `src/cpp/emit-module.js`.
- [x] Move built-in string call renderers out of `src/cpp/emit-module.js`.
- [x] Move primitive `toString()` call rendering out of `src/cpp/emit-module.js`.
- [x] Keep shared expression rendering passed in as narrow callbacks instead of creating broad cross-module state.
- [x] Keep spread-argument rendering reusable without duplicating call argument logic.
- [x] Export only the helper functions needed by `emit-module.js`.

### 115.2 Behavior Preservation Tasks

- [x] Keep generated C++ for existing array built-ins unchanged.
- [x] Keep generated C++ for existing string built-ins unchanged.
- [x] Keep generated C++ for primitive `.toString()` unchanged.
- [x] Keep fallback dynamic property calls unchanged.
- [x] Keep public `emitModule(...)` return shape unchanged.
- [x] Avoid changing parser, semantic analysis, lifetime analysis, or module resolution in this refactor.

### 115.3 Emitter Split Tests

- [x] Run or update snapshot coverage for `test/output/transpile-snapshots.test.js`.
- [x] Keep `test/api/transpile.test.js` array/string built-in assertions passing.
- [x] Keep `test/cpp/compiler.test.js` composite built-in compile case passing.
- [x] Add focused helper-level coverage for the extracted emission helpers.

## 116. Diagnostics And Source Organization Improvement

- [x] Extract unsupported built-in identifier diagnostics from `src/semantic/analyze.js` into a focused semantic helper module.
- [x] Extract supported built-in property classification from `src/semantic/analyze.js` into a focused semantic helper module.
- [x] Preserve all existing diagnostic message text unless a test explicitly updates it.
- [x] Add focused semantic tests only for newly covered diagnostic paths.
- [x] Keep `analyzeModule(...)` public API unchanged.

## 117. Parser Organization Improvement

- [x] Extract parser binding-pattern code from `src/parser/parse.js` into a focused parser helper module.
- [x] Extract parser import/export declaration parsing into a focused parser helper module.
- [x] Preserve current AST node shapes.
- [x] Preserve current syntax diagnostics unless a test explicitly updates them.
- [x] Keep `parse(sourceText)` public API unchanged.
- [x] Keep parser tests under `test/parser/`.

## 118. Standard Library Expansion: `jayess:string`

- [x] Add a focused `jayess:string` standard module.
- [x] Add explicit string helpers for `trim`, `startsWith`, `endsWith`, `includes`, `slice`, and `split`.
- [x] Keep helper behavior aligned with Jayess string semantics instead of JavaScript compatibility guesses.
- [x] Add a focused native bridge under `stdlib/jayess/string/`.
- [x] Add any required runtime helpers in a small string-focused runtime source file.
- [x] Add generated-output and runtime tests under `test/`.
- [x] Add `docs/jayess-string-module.md`.

### 118.1 String Module Runtime Tasks

- [x] Implement string argument validation for each exported helper.
- [x] Preserve current string value representation in generated C++.
- [x] Keep `slice` bounds behavior deterministic for negative and out-of-range indexes.
- [x] Keep `split` behavior focused on plain string separators for the first slice.
- [x] Add clear diagnostics for unsupported separator values.

### 118.2 String Module Tests

- [x] Add focused API-level transpile tests for imports from `jayess:string`.
- [x] Add generated-output assertions for string module bridge declarations.
- [x] Add C++ compile-validation coverage for the supported string helpers.
- [x] Add runtime semantic coverage for edge cases that affect Jayess behavior.

## 119. Standard Library Expansion: `jayess:array`

- [x] Add a focused `jayess:array` standard module.
- [x] Add explicit non-callback array helpers for `slice`, `concat`, `indexOf`, `includes`, and `join`.
- [x] Keep this slice focused on non-callback helpers and track callback helpers in section 127.
- [x] Add a focused native bridge under `stdlib/jayess/array/`.
- [x] Add any required runtime helpers in a small array-focused runtime source file.
- [x] Add generated-output and runtime tests under `test/`.
- [x] Add `docs/jayess-array-module.md`.

### 119.1 Array Module Runtime Tasks

- [x] Implement array argument validation for each exported helper.
- [x] Preserve current array value representation in generated C++.
- [x] Keep `slice` bounds behavior deterministic for negative and out-of-range indexes.
- [x] Keep `concat` behavior focused on array values for the first slice.
- [x] Keep `join` behavior deterministic for null-like Jayess values.
- [x] Add clear diagnostics for unsupported helper arguments.

### 119.2 Array Module Tests

- [x] Add focused API-level transpile tests for imports from `jayess:array`.
- [x] Add generated-output assertions for array module bridge declarations.
- [x] Add C++ compile-validation coverage for the supported array helpers.
- [x] Add runtime semantic coverage for edge cases that affect Jayess behavior.

## 120. Standard Library Expansion: `jayess:object`

- [x] Add or extend explicit object helpers for `has`, `keys`, `values`, `entries`, `fromEntries`, and `assign`.
- [x] Keep object helper behavior aligned with the current Jayess object model.
- [x] Reuse existing object runtime support where it is already focused and small.
- [x] Extract new runtime support into a focused object helper file when needed.
- [x] Add focused tests under `test/`.
- [x] Update or add object module documentation under `docs/`.

### 120.1 Object Module Runtime Tasks

- [x] Implement `has(object, key)` with explicit string-key validation.
- [x] Implement `keys(object)` using deterministic key ordering from the existing object representation.
- [x] Implement `values(object)` using the same ordering as `keys`.
- [x] Implement `entries(object)` using the same ordering as `keys`.
- [x] Implement `fromEntries(entries)` for Jayess array entry pairs.
- [x] Implement `assign(target, source)` for own enumerable object properties supported by Jayess.
- [x] Add clear diagnostics for unsupported object helper arguments.

## 121. Standard Library Expansion: `jayess:number`

- [x] Add or extend explicit number helpers for `isInteger`, `isFinite`, `parseInt`, and `parseFloat`.
- [x] Keep numeric parsing behavior deterministic and documented.
- [x] Reuse existing number runtime support where it is already focused and small.
- [x] Extract new runtime support into a focused number helper file when needed.
- [x] Add focused tests under `test/`.
- [x] Update or add number module documentation under `docs/`.

### 121.1 Number Module Runtime Tasks

- [x] Implement `isInteger(value)` for Jayess numeric values.
- [x] Implement `isFinite(value)` for Jayess numeric values.
- [x] Implement `parseInt(value)` with explicit string input validation.
- [x] Implement `parseFloat(value)` with explicit string input validation.
- [x] Add clear diagnostics for unsupported number helper arguments.

## 122. Async Follow-Up: Async Class Methods

- [x] Parse async instance method declarations in class bodies.
- [x] Preserve current async function declaration, expression, arrow, and `await` behavior.
- [x] Allow `await` inside async class method bodies.
- [x] Reject `await` in non-async class method bodies with the existing diagnostic style.
- [x] Lower async class methods through the existing async runtime model.
- [x] Keep async constructors unsupported according to Jayess language rules.
- [x] Add focused parser, semantic, output, and C++ compile-validation tests under `test/`.
- [x] Update async and class documentation under `docs/`.

### 122.1 Async Method Lowering Tasks

- [x] Reuse existing async function lowering helpers where possible.
- [x] Preserve `this` binding for async instance methods.
- [x] Preserve method call arity and argument handling.
- [x] Ensure async method return values use the existing Jayess async carrier.
- [x] Add diagnostics for invalid async method forms according to Jayess class rules.

## 123. Generator Follow-Up: Generator Class Methods

- [x] Parse generator instance method declarations in class bodies.
- [x] Preserve current generator declaration, expression, `yield`, and `yield*` behavior.
- [x] Allow `yield` inside generator class method bodies.
- [x] Reject `yield` in non-generator class method bodies with the existing diagnostic style.
- [x] Lower generator class methods through the existing generator runtime model.
- [x] Add focused parser, semantic, output, and C++ compile-validation tests under `test/`.
- [x] Update generator and class documentation under `docs/`.

### 123.1 Generator Method Lowering Tasks

- [x] Reuse existing generator function lowering helpers where possible.
- [x] Preserve `this` binding for generator instance methods.
- [x] Preserve method call arity and argument handling.
- [x] Ensure yielded values use the existing Jayess generator carrier.
- [x] Add diagnostics for invalid generator method forms according to Jayess generator rules.

## 124. Class-System Follow-Up: Private Static Members

- [x] Add parser support for private static fields in class bodies.
- [x] Add parser support for private static methods in class bodies.
- [x] Add semantic checks for private static member declarations.
- [x] Add semantic checks for private static member access.
- [x] Lower private static storage through a focused class-runtime path.
- [x] Preserve existing private instance field and method behavior.
- [x] Add focused parser, semantic, output, and C++ compile-validation tests under `test/`.
- [x] Update class documentation under `docs/`.

### 124.1 Private Static Member Runtime Tasks

- [x] Choose a deterministic private static storage key scheme.
- [x] Keep private static fields scoped to the declaring class.
- [x] Keep private static methods callable only through valid private access.
- [x] Preserve inheritance behavior already defined by Jayess class semantics.
- [x] Add clear diagnostics for invalid private static access.

## 125. System Module Expansion

- [x] Extend focused `jayess:system` support for process arguments, current working directory, environment reads, and exit code helpers.
- [x] Keep platform-specific behavior isolated in runtime support.
- [x] Keep filesystem and path behavior in explicit system modules rather than ambient globals.
- [x] Add small native bridges under `stdlib/jayess/system/` as needed.
- [x] Add focused tests under `test/`.
- [x] Update system module documentation under `docs/`.

### 125.1 System Module Runtime Tasks

- [x] Add `args()` for process arguments when the generated runtime has access to them.
- [x] Add `cwd()` using the existing platform abstraction style.
- [x] Add `getEnv(name)` with explicit string-key validation.
- [x] Add `hasEnv(name)` with explicit string-key validation.
- [x] Add `exitCode(value)` with explicit integer validation.
- [x] Add clear diagnostics for unsupported system helper arguments.

## 126. Async Runtime Library Expansion

- [x] Extend `jayess:async` with additional explicit helpers built on the current Jayess async carrier.
- [x] Add Jayess-native `allSettled` helper behavior without JavaScript `Promise` compatibility.
- [x] Add Jayess-native `any` helper behavior without changing existing async error semantics.
- [x] Add focused diagnostics for unsupported async helper inputs.
- [x] Add focused tests under `test/`.
- [x] Update async module documentation under `docs/`.

### 126.1 Async Helper Runtime Tasks

- [x] Reuse existing `resolved`, `rejected`, `all`, `race`, and `isAsync` runtime paths.
- [x] Preserve existing async carrier representation.
- [x] Preserve existing async error propagation behavior.
- [x] Keep helper input validation explicit and documented.

## 127. Callback-Based Library Helpers

- [x] Add callback ABI coverage for generated callable invocation, ownership, and lifetime behavior.
- [x] Add `jayess:array` callback helpers using the covered callback invocation path.
- [x] Implement `map` as the first callback-based array helper.
- [x] Implement `filter` with callback return coercion covered by tests.
- [x] Implement `reduce` with callback accumulator behavior covered by tests.
- [x] Add focused tests under `test/`.
- [x] Update array module documentation under `docs/`.

### 127.1 Callback Helper Runtime Tasks

- [x] Reuse the existing generated callable representation.
- [x] Validate callback arguments before iteration starts.
- [x] Preserve array element lifetime across callback calls.
- [x] Preserve callback return value ownership across generated C++ scopes.
- [x] Add clear diagnostics for unsupported callback helper arguments.

## 128. Multi-Threading Module: `jayess:thread`

- [x] Add a focused `jayess:thread` standard module.
- [x] Add explicit thread helpers for `spawn`, `join`, `sleep`, `hardwareConcurrency`, and `currentId`.
- [x] Lower thread support through isolated runtime helpers backed by portable C++ standard-library threading.
- [x] Keep threading as an explicit imported module instead of ambient globals.
- [x] Implement value transfer so worker threads do not require shared mutable state.
- [x] Add clear diagnostics for unsupported thread arguments, invalid handles, and invalid joins.
- [x] Add focused parser, semantic, runtime, generated-output, and C++ compile-validation tests under `test/`.
- [x] Add `docs/jayess-thread-module.md`.

### 128.1 Thread Runtime Tasks

- [x] Add a Jayess thread handle runtime value backed by `std::thread`.
- [x] Add deterministic handle state tracking for pending, joined, detached, completed, and failed worker states.
- [x] Implement `spawn(callback, args)` using the existing generated callable representation.
- [x] Implement `join(handle)` so completed worker results return through the existing Jayess value representation.
- [x] Implement worker error capture and propagation through `join(handle)`.
- [x] Implement `sleep(milliseconds)` with explicit non-negative integer validation.
- [x] Implement `hardwareConcurrency()` with deterministic fallback behavior.
- [x] Implement `currentId()` as a stable Jayess string value.
- [x] Add runtime cleanup behavior for thread handles that leave scope before being joined.

### 128.2 Thread Value Transfer Tasks

- [x] Add thread-safe value transfer for numbers, booleans, strings, and null-like Jayess values.
- [x] Add thread-safe value transfer for arrays containing supported transfer values.
- [x] Add thread-safe value transfer for plain objects containing supported transfer values.
- [x] Preserve ownership and lifetime boundaries across worker threads.
- [x] Add diagnostics for values that cannot cross a thread boundary.
- [x] Keep transferred worker arguments independent from the caller's mutable objects.

### 128.3 Thread Module Tests

- [x] Add API-level transpile tests for imports from `jayess:thread`.
- [x] Add generated-output assertions for thread module bridge declarations.
- [x] Add runtime-source assertions for thread handle storage and worker state helpers.
- [x] Add C++ compile-validation coverage for `spawn`, `join`, `sleep`, `hardwareConcurrency`, and `currentId`.
- [x] Add runtime semantic coverage for worker return values.
- [x] Add runtime semantic coverage for worker error propagation.
- [x] Add diagnostics coverage for invalid handles and unsupported transferred values.

## 129. Generator Lowering Hardening

- [x] Extend generator lowering so yielded values can appear inside nested statement blocks.
- [x] Extend generator lowering so yielded values can appear inside `if` and `else` branches.
- [x] Extend generator lowering so yielded values can appear inside `while` loops.
- [x] Extend generator lowering so yielded values can appear inside `for` loops.
- [x] Add generator-local destructuring declaration lowering for array and object binding patterns already accepted by the parser.
- [x] Preserve existing generator declaration, generator expression, and generator class method behavior.
- [x] Preserve existing `yield` and `yield*` runtime value representation.
- [x] Add focused semantic, output, and C++ compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 129.1 Generator Lowering Procedure

- [x] Review the current generator lowering control-flow representation in `src/cpp/emit-generator.js`.
- [x] Extract one focused helper for generator statement lowering if the current file needs smaller responsibilities.
- [x] Add a small internal representation for nested generator steps that can be reused by blocks, branches, and loops.
- [x] Lower `BlockStatement` bodies without flattening unrelated function emission logic.
- [x] Lower `IfStatement` branches while preserving condition evaluation order.
- [x] Lower `WhileStatement` bodies while preserving loop condition re-check behavior after resume.
- [x] Lower `ForStatement` initializer, condition, update, and body in the same order as ordinary Jayess execution.
- [x] Lower generator-local array destructuring declarations through the existing binding-pattern semantics.
- [x] Lower generator-local object destructuring declarations through the existing binding-pattern semantics.
- [x] Keep diagnostics focused when a generator statement form is still outside this implementation slice.

### 129.2 Generator Hardening Tests

- [x] Add parser or semantic coverage only where existing tests do not already cover the accepted syntax.
- [x] Add output tests for `yield` inside nested blocks.
- [x] Add output tests for `yield` inside `if` and `else`.
- [x] Add output tests for `yield` inside `while`.
- [x] Add output tests for `yield` inside `for`.
- [x] Add output tests for generator-local array destructuring.
- [x] Add output tests for generator-local object destructuring.
- [x] Add C++ compile-validation coverage for the new generator lowering paths.
- [x] Keep each new generator test file or fixture small and focused.

## 130. Standard Library Expansion: `jayess:math`

- [x] Add a focused `jayess:math` standard module.
- [x] Add deterministic numeric helpers for `abs`, `floor`, `ceil`, `round`, `min`, `max`, `sqrt`, and `pow`.
- [x] Keep math helper behavior aligned with Jayess numeric semantics instead of JavaScript coercion.
- [x] Add a focused native bridge under `stdlib/jayess/math/`.
- [x] Add required runtime helpers in a small math-focused runtime source file.
- [x] Add generated-output, runtime-source, module graph, API, and C++ compile-validation tests under `test/`.
- [x] Add `docs/jayess-math-module.md`.

### 130.1 Math Module Runtime Tasks

- [x] Implement shared numeric argument validation for math helpers.
- [x] Implement `abs(value)` for Jayess numeric values.
- [x] Implement `floor(value)` for Jayess numeric values.
- [x] Implement `ceil(value)` for Jayess numeric values.
- [x] Implement `round(value)` with documented deterministic midpoint behavior.
- [x] Implement `min(...values)` with explicit numeric input validation.
- [x] Implement `max(...values)` with explicit numeric input validation.
- [x] Implement `sqrt(value)` with documented behavior for negative input.
- [x] Implement `pow(base, exponent)` with explicit numeric input validation.
- [x] Add clear diagnostics for unsupported math helper arguments.

### 130.2 Math Module Integration Tasks

- [x] Add `stdlib/jayess/math/index.js` exports as thin Jayess wrappers.
- [x] Add `stdlib/jayess/math/math-primitives.hpp` bridge declarations.
- [x] Include the math runtime source in generated C++ only when the module graph imports `jayess:math`.
- [x] Ensure package import resolution recognizes `jayess:math` through the existing standard-library path.
- [x] Keep parser syntax unchanged for this slice.
- [x] Keep semantic built-in diagnostics aligned with explicit `jayess:math` imports.

### 130.3 Math Module Tests

- [x] Add a focused fixture under `test/fixtures/modules/` for `jayess:math`.
- [x] Add API-level transpile tests for imports from `jayess:math`.
- [x] Add module graph tests for resolving `jayess:math`.
- [x] Add generated-output assertions for math bridge declarations.
- [x] Add runtime-source assertions for math helper validation and implementation hooks.
- [x] Add C++ compile-validation coverage for the supported math helpers.
- [x] Add runtime semantic coverage for edge cases that affect Jayess behavior.

## 131. Maintainability Improvement: Large File Extraction

- [x] Extract one focused responsibility from `src/parser/parse.js` without changing parser behavior.
- [x] Extract one focused responsibility from `src/semantic/analyze.js` without changing semantic behavior.
- [x] Extract one focused responsibility from `src/cpp/emit-module.js` without changing generated C++ output.
- [x] Keep public parser, semantic analyzer, and C++ emitter APIs unchanged.
- [x] Preserve current diagnostics unless a focused test explicitly updates them.
- [x] Add or update focused tests under `test/` only where behavior coverage is missing.
- [x] Keep each extraction small enough to review independently.

### 131.1 Parser Extraction Tasks

- [x] Identify one parser responsibility still embedded in `src/parser/parse.js`.
- [x] Move that responsibility into a focused file under `src/parser/`.
- [x] Pass parser state through narrow callbacks or small helper arguments.
- [x] Preserve existing AST node shapes.
- [x] Preserve existing parser error messages.
- [x] Run focused parser tests after extraction.

### 131.2 Semantic Extraction Tasks

- [x] Identify one semantic responsibility still embedded in `src/semantic/analyze.js`.
- [x] Move that responsibility into a focused file under `src/semantic/`.
- [x] Keep scope, binding, and diagnostic state boundaries explicit.
- [x] Preserve existing semantic diagnostics.
- [x] Preserve `analyzeModule(...)` return shape.
- [x] Run focused semantic tests after extraction.

### 131.3 C++ Emitter Extraction Tasks

- [x] Identify one C++ emission responsibility still embedded in `src/cpp/emit-module.js`.
- [x] Move that responsibility into a focused file under `src/cpp/`.
- [x] Pass expression rendering, statement rendering, and temporary-name creation through narrow callbacks where needed.
- [x] Preserve generated C++ for existing snapshot cases.
- [x] Preserve runtime include and helper registration behavior.
- [x] Run focused output and compile-validation tests after extraction.

## 132. Generator Expression-Yield Lowering

- [x] Extend generator lowering so `yield` can appear inside selected larger expressions.
- [x] Preserve existing direct `yield`, direct `yield*`, nested block, branch, loop, and generator-local destructuring behavior.
- [x] Keep generator lowering based on explicit state slots and Jayess generator handles.
- [x] Add focused output and C++ compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 132.1 Expression-Yield Procedure

- [x] Review current `containsYieldExpression(...)` rejection paths in `src/cpp/emit-generator.js`.
- [x] Add a small expression-lowering helper for generator expressions that need suspension points.
- [x] Lower `return yield value` through a resume state that completes with the resumed value.
- [x] Lower variable initializers such as `var result = 1 + (yield value)` without re-evaluating the left operand after resume.
- [x] Lower call arguments such as `use(yield value)` without re-evaluating earlier arguments after resume.
- [x] Lower assignment RHS forms such as `target = yield value`.
- [x] Lower binary expression forms where either side contains a direct `yield`.
- [x] Keep unsupported expression-yield forms diagnosed through focused generator-lowering errors.
- [x] Preserve generated C++ validity across switch case labels and local temporary initialization.

### 132.2 Expression-Yield Tests

- [x] Add API/output tests for `return yield value`.
- [x] Add API/output tests for binary expressions containing `yield`.
- [x] Add API/output tests for call arguments containing `yield`.
- [x] Add API/output tests for assignment RHS containing `yield`.
- [x] Add C++ compile-validation tests for each new expression-yield lowering path.
- [x] Keep generator tests small and focused.

## 133. Generator `yield*` Destructuring

- [x] Support generator-local array destructuring initialized from direct `yield*`.
- [x] Support generator-local object destructuring initialized from direct `yield*`.
- [x] Reuse the shared C++ destructuring emission helper.
- [x] Preserve existing direct `yield*` delegation behavior and completion-value handling.
- [x] Add focused output and C++ compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 133.1 Yield-Star Destructuring Procedure

- [x] Review the current generator diagnostic for destructuring declarations initialized from `yield*`.
- [x] Store the delegated generator completion value in a predeclared generator temporary.
- [x] Run array destructuring assignments from the delegated completion value after delegation completes.
- [x] Run object destructuring assignments from the delegated completion value after delegation completes.
- [x] Ensure destructuring temporaries are captured outside generator resume switch labels.
- [x] Preserve delegated yielded values while the delegated generator is still running.
- [x] Keep diagnostics focused for destructuring patterns that remain outside this slice.

### 133.2 Yield-Star Destructuring Tests

- [x] Add output tests for `var [first, second] = yield* source;`.
- [x] Add output tests for `var { value } = yield* source;`.
- [x] Add C++ compile-validation coverage for array destructuring from `yield*`.
- [x] Add C++ compile-validation coverage for object destructuring from `yield*`.
- [x] Keep tests under `test/` and avoid generated-output fixture churn outside the slice.

## 134. Iterator Module: `jayess:iter`

- [x] Add a focused `jayess:iter` standard module for Jayess generator handles.
- [x] Add explicit helpers for `next`, `toArray`, `take`, `map`, and `filter`.
- [x] Keep iterator behavior Jayess-owned rather than JavaScript iterator-protocol emulation.
- [x] Add a focused native bridge under `stdlib/jayess/iter/`.
- [x] Add required runtime helpers in a small iterator-focused runtime source file.
- [x] Add generated-output, runtime-source, module graph, API, and C++ compile-validation tests under `test/`.
- [x] Add `docs/jayess-iter-module.md`.

### 134.1 Iterator Runtime Tasks

- [x] Implement generator-handle argument validation.
- [x] Implement `next(generator)` returning the next yielded value or Jayess `null` after completion.
- [x] Implement `toArray(generator)` collecting yielded values until completion.
- [x] Implement `take(generator, count)` with explicit non-negative integer validation.
- [x] Implement `map(generator, callback)` using the existing generated callable representation.
- [x] Implement `filter(generator, callback)` using Jayess truthiness for callback results.
- [x] Preserve callback return ownership and yielded value lifetime across helper calls.
- [x] Add clear diagnostics for unsupported iterator helper arguments.

### 134.2 Iterator Module Integration Tasks

- [x] Add `stdlib/jayess/iter/index.js` exports as thin Jayess wrappers.
- [x] Add `stdlib/jayess/iter/iter-primitives.hpp` bridge declarations.
- [x] Include iterator runtime declarations through the existing runtime-source organization.
- [x] Ensure package import resolution recognizes `jayess:iter` through the existing standard-library path.
- [x] Keep parser syntax unchanged for this slice.
- [x] Keep semantic diagnostics aligned with explicit `jayess:iter` imports.

### 134.3 Iterator Module Tests

- [x] Add a focused fixture under `test/fixtures/modules/` for `jayess:iter`.
- [x] Add API-level transpile tests for imports from `jayess:iter`.
- [x] Add module graph tests for resolving `jayess:iter`.
- [x] Add generated-output assertions for iterator bridge declarations.
- [x] Add runtime-source assertions for iterator helper validation and implementation hooks.
- [x] Add C++ compile-validation coverage for the supported iterator helpers.
- [x] Add runtime semantic coverage for completion and callback behavior.

## 135. Standard Library Expansion: `jayess:path`

- [x] Extend the focused `jayess:path` standard module.
- [x] Add explicit path helpers for `join`, `dirname`, `basename`, and `extname`.
- [x] Keep path behavior deterministic and platform-isolated in runtime support.
- [x] Add or update a focused native bridge under `stdlib/jayess/path/`.
- [x] Add required runtime helpers in a small path-focused runtime source file.
- [x] Add generated-output, runtime-source, module graph, API, and C++ compile-validation tests under `test/`.
- [x] Add or update path module documentation under `docs/`.

### 135.1 Path Module Runtime Tasks

- [x] Implement shared string argument validation for path helpers.
- [x] Implement `join(...parts)` with explicit string-part validation.
- [x] Implement `dirname(path)` for string paths.
- [x] Implement `basename(path)` for string paths.
- [x] Implement `extname(path)` for string paths.
- [x] Keep platform-specific separator behavior isolated in C++ runtime support.
- [x] Add clear diagnostics for unsupported path helper arguments.

### 135.2 Path Module Tests

- [x] Add a focused fixture under `test/fixtures/modules/` for `jayess:path`.
- [x] Add API-level transpile tests for imports from `jayess:path`.
- [x] Add module graph tests for resolving `jayess:path`.
- [x] Add generated-output assertions for path bridge declarations.
- [x] Add runtime-source assertions for path helper validation and implementation hooks.
- [x] Add C++ compile-validation coverage for the supported path helpers.

## 136. Standard Library Expansion: `jayess:fs`

- [x] Extend the focused `jayess:fs` standard module.
- [x] Add explicit filesystem helpers for `readText`, `writeText`, and `exists`.
- [x] Keep filesystem behavior explicit through imported modules instead of ambient globals.
- [x] Add or update a focused native bridge under `stdlib/jayess/fs/`.
- [x] Add required runtime helpers in a small filesystem-focused runtime source file.
- [x] Add generated-output, runtime-source, module graph, API, and C++ compile-validation tests under `test/`.
- [x] Add or update filesystem module documentation under `docs/`.

### 136.1 Filesystem Runtime Tasks

- [x] Implement shared string path validation for filesystem helpers.
- [x] Implement `readText(path)` with deterministic text-file behavior.
- [x] Implement `writeText(path, text)` with explicit string content validation.
- [x] Implement `exists(path)` returning a Jayess boolean.
- [x] Keep platform-specific filesystem behavior isolated in C++ runtime support.
- [x] Add clear diagnostics for unsupported filesystem helper arguments and failed file operations.

### 136.2 Filesystem Module Tests

- [x] Add a focused fixture under `test/fixtures/modules/` for `jayess:fs`.
- [x] Add API-level transpile tests for imports from `jayess:fs`.
- [x] Add module graph tests for resolving `jayess:fs`.
- [x] Add generated-output assertions for filesystem bridge declarations.
- [x] Add runtime-source assertions for filesystem helper validation and implementation hooks.
- [x] Add C++ compile-validation coverage for the supported filesystem helpers.

## 137. Inheritance Follow-Up: Static Inheritance

- [x] Extend class lowering so derived classes can inherit supported static members from a Jayess base class.
- [x] Preserve existing instance inheritance, `super(...)`, and `super.method(...)` behavior.
- [x] Keep inheritance behavior explicit in the class runtime helpers.
- [x] Add focused semantic, output, and C++ compile-validation tests under `test/`.
- [x] Update inheritance and class documentation under `docs/`.

### 137.1 Static Inheritance Procedure

- [x] Review current class-chain runtime helpers for instance member lookup.
- [x] Add a focused class-runtime helper for static class-chain lookup.
- [x] Lower derived class creation so static lookup can fall back to the base class.
- [x] Preserve own static field and static method precedence over inherited static members.
- [x] Preserve private static member isolation to the declaring class.
- [x] Keep static initialization block ordering unchanged.
- [x] Add semantic checks for invalid static inheritance forms.
- [x] Keep diagnostics focused for unsupported `super` static forms outside this slice.

### 137.2 Static Inheritance Tests

- [x] Add parser or semantic tests only where existing syntax coverage is missing.
- [x] Add output tests for inherited static method lookup.
- [x] Add output tests for inherited static field lookup.
- [x] Add output tests proving own static members override inherited static members.
- [x] Add C++ compile-validation coverage for derived classes using inherited static members.
- [x] Update docs for current static inheritance behavior.

## 138. Maintainability Improvement: Large File Extraction Follow-Up

- [x] Extract one additional focused responsibility from `src/parser/parse.js` without changing parser behavior.
- [x] Extract one additional focused responsibility from `src/semantic/analyze.js` without changing semantic behavior.
- [x] Extract one additional focused responsibility from `src/cpp/emit-module.js` without changing generated C++ output.
- [x] Keep public parser, semantic analyzer, and C++ emitter APIs unchanged.
- [x] Preserve current diagnostics unless a focused test explicitly updates them.
- [x] Add or update focused tests under `test/` only where behavior coverage is missing.
- [x] Keep each extraction small enough to review independently.

### 138.1 Parser Follow-Up Extraction Tasks

- [x] Identify one parser responsibility still embedded in `src/parser/parse.js`.
- [x] Move that responsibility into a focused file under `src/parser/`.
- [x] Pass parser state through narrow callbacks or small helper arguments.
- [x] Preserve existing AST node shapes.
- [x] Preserve existing parser error messages.
- [x] Run focused parser tests after extraction.

### 138.2 Semantic Follow-Up Extraction Tasks

- [x] Identify one semantic responsibility still embedded in `src/semantic/analyze.js`.
- [x] Move that responsibility into a focused file under `src/semantic/`.
- [x] Keep scope, binding, and diagnostic state boundaries explicit.
- [x] Preserve existing semantic diagnostics.
- [x] Preserve `analyzeModule(...)` return shape.
- [x] Run focused semantic tests after extraction.

### 138.3 C++ Emitter Follow-Up Extraction Tasks

- [x] Identify one C++ emission responsibility still embedded in `src/cpp/emit-module.js`.
- [x] Move that responsibility into a focused file under `src/cpp/`.
- [x] Pass expression rendering, statement rendering, and temporary-name creation through narrow callbacks where needed.
- [x] Preserve generated C++ for existing snapshot cases.
- [x] Preserve runtime include and helper registration behavior.
- [x] Run focused output and compile-validation tests after extraction.
