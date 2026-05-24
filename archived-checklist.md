# Jayess to C++ Transpiler Checklist

This file archives completed milestones that were moved out of the active [checklist.md](./checklist.md) to keep the working roadmap small and focused.

This checklist turns the architecture and constraints from `Agents.md` into small implementation tasks for building the first usable version of the Jayess transpiler.

The repository is currently close to empty, so the checklist starts with minimal vertical slices and then expands stage by stage. Keep changes incremental and behavior-preserving.

Completed milestones through section 308 now live here.

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

## 139. Documentation Consistency Cleanup

- [x] Align documentation with shipped static inheritance behavior.
- [x] Align documentation with shipped generator expression-yield behavior.
- [x] Align documentation with shipped `jayess:iter`, `jayess:path`, and `jayess:fs` behavior.
- [x] Keep unsupported-by-design statements matched to `Jayess.md` and `Agents.md`.
- [x] Keep documentation changes in focused markdown files under `docs/`.
- [x] Run focused documentation text scans after updates.

### 139.1 Static Inheritance Documentation Tasks

- [x] Scan `docs/overview.md`, `docs/semantics.md`, `docs/limitations.md`, and `docs/stdlib-and-core-model.md` for stale static-inheritance wording.
- [x] Replace stale claims that public static inheritance is outside the current slice.
- [x] Document own static member precedence over inherited public static members.
- [x] Document that private static storage remains class-owned and does not become public static inheritance.
- [x] Keep unsupported `super` forms documented separately from public static member inheritance.

### 139.2 Generator Documentation Tasks

- [x] Scan generator documentation for stale claims about expression `yield`.
- [x] Document supported expression-yield forms: `return yield value`, binary expressions, call arguments, and simple assignment right-hand sides.
- [x] Document sent-value resume behavior through the Jayess generator runtime.
- [x] Document remaining unsupported short-circuit expression-yield forms with current diagnostics.
- [x] Keep async-generator language aligned with `Jayess.md` and current parser diagnostics.

### 139.3 Standard Module Documentation Tasks

- [x] Verify `docs/jayess-iter-module.md` describes `next`, `toArray`, `take`, `map`, and `filter`.
- [x] Verify `docs/jayess-path-module.md` describes the current path helper surface.
- [x] Verify `docs/jayess-fs-module.md` describes the current filesystem helper surface.
- [x] Cross-link module docs from `docs/overview.md` where appropriate.
- [x] Keep Node.js compatibility wording explicit: Jayess-owned modules, not ambient Node built-ins.

## 140. Diagnostics Hardening: Generator And Class Unsupported Forms

- [x] Convert selected generator-lowering raw errors into semantic diagnostics before C++ emission.
- [x] Convert selected class/super raw errors into semantic diagnostics before C++ emission.
- [x] Preserve existing successful generated C++ output.
- [x] Keep diagnostics focused and source-located.
- [x] Add focused tests under `test/semantic/` and `test/api/`.

### 140.1 Generator Diagnostics Tasks

- [x] Add semantic diagnostics for short-circuit expression-yield forms.
- [x] Add semantic diagnostics for spread call arguments that contain `yield`.
- [x] Add semantic diagnostics for unsupported generator statement forms still rejected during lowering.
- [x] Add tests proving direct `yield`, `yield*`, and supported expression-yield forms still pass semantic analysis.
- [x] Add tests proving unsupported generator forms fail with `JayessError` diagnostics before C++ emission.

### 140.2 Class And `super` Diagnostics Tasks

- [x] Add semantic diagnostics for computed `super[expr]` member access.
- [x] Add semantic diagnostics for unsupported `super` property assignment forms.
- [x] Add semantic diagnostics for unsupported class-side `super` calls outside the implemented slice.
- [x] Preserve current valid `super(...)`, `super.method(...)`, and public static inheritance behavior.
- [x] Add focused tests for each unsupported `super` form.

## 141. Parser Maintainability: Class And Function Parsing Split

- [x] Extract one focused class parsing responsibility from `src/parser/parse.js`.
- [x] Extract one focused function or parameter parsing responsibility from `src/parser/parse.js`.
- [x] Keep the public `parse(sourceText)` API unchanged.
- [x] Preserve AST node shapes exactly.
- [x] Preserve parser diagnostics exactly unless tests explicitly update wording.
- [x] Keep extraction files small and reviewable.

### 141.1 Class Parser Extraction Tasks

- [x] Move class member parsing helpers into `src/parser/classes.js`.
- [x] Pass only narrow parser operations needed by class parsing.
- [x] Preserve constructor, static member, private member, computed member, and static block parsing behavior.
- [x] Preserve async/generator constructor diagnostics.
- [x] Add or update parser organization tests under `test/parser/`.
- [x] Run focused parser tests after extraction.

### 141.2 Function Parser Extraction Tasks

- [x] Move function parameter parsing helpers into `src/parser/functions.js`.
- [x] Preserve ordinary, async, generator, arrow, default, rest, and trailing-comma parameter behavior.
- [x] Preserve default-parameter AST node shape.
- [x] Preserve diagnostics for unsupported async forms and malformed parameter lists.
- [x] Add or update focused parser tests under `test/parser/`.
- [x] Run focused parser tests after extraction.

## 142. Semantic Maintainability: Class And Expression Analysis Split

- [x] Extract one focused class/private-member semantic responsibility from `src/semantic/analyze.js`.
- [x] Extract one focused expression-analysis responsibility from `src/semantic/analyze.js`.
- [x] Keep `analyzeModule(...)` public return shape unchanged.
- [x] Preserve scope, binding, import, export, and diagnostic behavior.
- [x] Add focused tests only where coverage is missing.

### 142.1 Class Semantic Extraction Tasks

- [x] Move class member validation helpers into `src/semantic/classes.js`.
- [x] Preserve duplicate private-name diagnostics.
- [x] Preserve private static and private instance access validation.
- [x] Preserve inheritance base diagnostics.
- [x] Preserve static block and class-side access behavior.
- [x] Run focused class semantic tests after extraction.

### 142.2 Expression Semantic Extraction Tasks

- [x] Move expression validation dispatch into `src/semantic/expressions.js` where practical.
- [x] Keep scope lookup and builtin classification boundaries explicit.
- [x] Preserve unsupported ambient builtin diagnostics.
- [x] Preserve assignment and update target diagnostics.
- [x] Preserve yield and await legality checks.
- [x] Run focused semantic tests after extraction.

## 143. Generator Follow-Up: Short-Circuit Expression Yield

- [x] Extend generator lowering for short-circuit expression-yield forms.
- [x] Preserve JavaScript-like short-circuit evaluation order within Jayess semantics.
- [x] Preserve sent-value resume behavior.
- [x] Preserve generated C++ validity across resume switch labels.
- [x] Add focused API/output, runtime, and C++ compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 143.1 Short-Circuit Lowering Tasks

- [x] Lower `left && (yield value)` without evaluating the yield when `left` is falsey.
- [x] Lower `left || (yield value)` without evaluating the yield when `left` is truthy.
- [x] Lower `left ?? (yield value)` without evaluating the yield when `left` is not Jayess `null`.
- [x] Preserve left operand evaluation exactly once.
- [x] Preserve yielded current value and resumed sent value.
- [x] Keep unsupported nested short-circuit patterns diagnosed until each supported shape has tests.

### 143.2 Short-Circuit Tests

- [x] Add API/output tests for `&&` expression-yield lowering.
- [x] Add API/output tests for `||` expression-yield lowering.
- [x] Add API/output tests for `??` expression-yield lowering.
- [x] Add C++ compile-validation tests for each supported short-circuit form.
- [x] Add runtime-source assertions only if a runtime helper is introduced.
- [x] Update `docs/generator-lowering.md`.

## 144. Class Follow-Up: Public Static `super` Calls

- [x] Implement supported public static `super.method(...)` calls in static class methods.
- [x] Reuse the existing class-chain runtime model.
- [x] Preserve public static own-member precedence.
- [x] Preserve private static isolation.
- [x] Preserve existing instance `super.method(...)` behavior.
- [x] Add focused semantic, output, runtime-source, and C++ compile-validation tests under `test/`.
- [x] Update class documentation under `docs/`.

### 144.1 Static `super` Lowering Tasks

- [x] Add semantic recognition for `super.method(...)` inside static methods.
- [x] Reject `super.staticField` reads outside supported static-method call form with focused diagnostics.
- [x] Lower `super.method(...)` to public static lookup starting from the base class.
- [x] Bind static method `this` consistently with the current class-side callable model.
- [x] Preserve computed `super[expr]` diagnostics.
- [x] Preserve `super` assignment diagnostics.

### 144.2 Static `super` Tests

- [x] Add semantic tests for valid static `super.method(...)`.
- [x] Add semantic tests for unsupported static `super` forms.
- [x] Add API/output tests for generated static `super.method(...)` lookup.
- [x] Add C++ compile-validation tests for inherited public static method calls.
- [x] Add tests proving private static members are not exposed through public static `super`.
- [x] Update `docs/semantics.md`, `docs/overview.md`, and `docs/limitations.md`.

## 145. Standard Library Expansion: Array And String Helpers

- [x] Expand `jayess:array` with one focused helper family.
- [x] Expand `jayess:string` with one focused helper family.
- [x] Keep helpers Jayess-owned instead of ambient JavaScript globals.
- [x] Add or update focused native bridge headers under `stdlib/jayess/`.
- [x] Keep runtime additions in small focused runtime source files.
- [x] Add module graph, API, output, runtime-source, and C++ compile-validation tests.
- [x] Update docs under `docs/`.

### 145.1 `jayess:array` Helper Tasks

- [x] Add `slice(values, start, end)` as an explicit module helper.
- [x] Add `map(values, callback)` as an explicit module helper.
- [x] Add `filter(values, callback)` as an explicit module helper.
- [x] Add `reduce(values, callback, initial)` as an explicit module helper.
- [x] Preserve existing array method built-ins.
- [x] Add clear diagnostics for unsupported helper arguments.

### 145.2 `jayess:string` Helper Tasks

- [x] Add `trim(text)` as an explicit module helper.
- [x] Add `split(text, separator)` as an explicit module helper.
- [x] Add `includes(text, search)` as an explicit module helper.
- [x] Add `indexOf(text, search)` as an explicit module helper.
- [x] Add `startsWith(text, search)` and `endsWith(text, search)` as explicit module helpers.
- [x] Add clear diagnostics for unsupported helper arguments.

### 145.3 Array And String Tests

- [x] Add focused fixtures under `test/fixtures/modules/`.
- [x] Add module graph tests for `jayess:array` and `jayess:string`.
- [x] Add generated-output assertions for native bridge declarations.
- [x] Add runtime-source assertions for helper implementations.
- [x] Add C++ compile-validation tests for generated projects using the helpers.
- [x] Update `docs/jayess-array-module.md` and `docs/jayess-string-module.md`.

## 146. Module Resolver Diagnostics Hardening

- [x] Improve package-import diagnostics for JavaScript-oriented packages that are not valid Jayess packages.
- [x] Preserve closed compile-time module graph behavior.
- [x] Preserve rejection of dynamic import and runtime module loading.
- [x] Keep resolver changes focused under `src/modules/`.
- [x] Add package fixture tests under `test/fixtures/package-project/`.
- [x] Update module-resolution documentation under `docs/`.

### 146.1 Resolver Diagnostic Tasks

- [x] Add a focused diagnostic for package entry files with unsupported extensions.
- [x] Add a focused diagnostic for package `exports` maps with no supported Jayess target.
- [x] Add a focused diagnostic for package entries that point outside the package root.
- [x] Add a focused diagnostic for missing package entry files.
- [x] Preserve existing relative import and built-in module resolution behavior.
- [x] Preserve import-cycle diagnostics.

### 146.2 Resolver Tests

- [x] Add fixture packages for unsupported extension entries.
- [x] Add fixture packages for unsupported `exports` maps.
- [x] Add fixture packages for missing entry files.
- [x] Add module graph tests for each diagnostic.
- [x] Add `transpileFile(...)` tests proving diagnostics surface through the public API.
- [x] Update `docs/builtin-module-policy.md` or module-resolution docs.

## 147. Lifetime And Escape Analysis Strengthening

- [x] Add escape-analysis coverage for newer feature families.
- [x] Keep Jayess scope-based memory policy explicit.
- [x] Avoid runtime ownership changes unless tests expose a concrete mismatch.
- [x] Keep tests focused under `test/lifetime/`.
- [x] Update memory/lifetime documentation under `docs/`.

### 147.1 Escape Analysis Test Tasks

- [x] Add tests for generator captures that outlive the defining scope.
- [x] Add tests for async captures that settle after the defining scope.
- [x] Add tests for class method closures capturing private/static class context.
- [x] Add tests for thread worker captures crossing runtime worker boundaries.
- [x] Add tests for module-exported closures and exported class values.
- [x] Preserve existing non-escaping local behavior.

### 147.2 Lifetime Documentation Tasks

- [x] Document how generator handles retain captured values.
- [x] Document how async handles retain captured values.
- [x] Document how class values retain static and method state.
- [x] Document how thread helpers transfer values across workers.
- [x] Keep documentation aligned with scope-based automatic memory handling and no garbage collection.

## 148. Standard Library Expansion: Console And IO Helpers

- [x] Add a Jayess-owned console or IO module surface for basic terminal output.
- [x] Keep output helpers explicit under `jayess:*` instead of adding ambient JavaScript globals.
- [x] Keep runtime support isolated in focused C++ runtime fragment files.
- [x] Add module graph, generated-output, runtime-source, and C++ compile-validation tests under `test/`.
- [x] Document the module in a focused markdown file under `docs/`.

### 148.1 Module Surface Tasks

- [x] Add `stdlib/jayess/console/index.js` or `stdlib/jayess/io/index.js` with explicit exports.
- [x] Add `log(value)` for newline-terminated standard output.
- [x] Add `error(value)` for newline-terminated standard error.
- [x] Add `write(text)` for non-newline standard output text.
- [x] Add `writeLine(text)` for newline-terminated text output.
- [x] Add focused runtime argument validation for text-only helpers where text is required.
- [x] Keep value formatting aligned with current Jayess runtime string conversion rules.

### 148.2 Runtime And Output Tasks

- [x] Add a focused runtime source fragment such as `src/cpp/runtime-console-source.js`.
- [x] Add primitive declarations through `stdlib/jayess/console/console-primitives.hpp`.
- [x] Wire the runtime fragment into the existing runtime writer.
- [x] Preserve deterministic generated C++ output.
- [x] Add tests proving the module resolves through `transpileFile()`.
- [x] Add generated-output assertions for emitted primitive calls.
- [x] Add compile-validation coverage for a generated project importing the module.

### 148.3 Documentation Tasks

- [x] Add `docs/jayess-console-module.md` or `docs/jayess-io-module.md`.
- [x] Document each exported helper and its argument shape.
- [x] Document that the module is Jayess-owned and not ambient Node.js `console`.
- [x] Cross-link the module from `docs/overview.md` and `docs/stdlib-and-core-model.md`.

## 149. Standard Library Expansion: Bytes Module

- [x] Add a Jayess-owned `jayess:bytes` module for binary data.
- [x] Keep binary data separate from strings.
- [x] Add the smallest runtime representation needed for byte arrays.
- [x] Add focused module, output, runtime-source, and compile-validation tests under `test/`.
- [x] Document bytes semantics under `docs/`.

### 149.1 Bytes Runtime Tasks

- [x] Define a narrow bytes runtime value representation.
- [x] Add runtime predicates and conversions needed by the first helper family.
- [x] Keep bytes storage ownership explicit and RAII-friendly in generated C++.
- [x] Add runtime errors for non-bytes and non-string inputs where appropriate.
- [x] Keep bytes helpers out of ambient JavaScript global scope.

### 149.2 Bytes Module Tasks

- [x] Add `stdlib/jayess/bytes/index.js`.
- [x] Add `fromUtf8(text)`.
- [x] Add `toUtf8(bytes)`.
- [x] Add `length(bytes)`.
- [x] Add `slice(bytes, start, ...end)`.
- [x] Add `concat(left, right)`.
- [x] Add `equals(left, right)`.
- [x] Add `isBytes(value)`.

### 149.3 Bytes Tests And Docs

- [x] Add module graph tests for `jayess:bytes`.
- [x] Add generated-output assertions for bytes primitive declarations.
- [x] Add runtime-source assertions for bytes helper implementation.
- [x] Add C++ compile-validation tests for basic bytes usage.
- [x] Add `docs/jayess-bytes-module.md`.
- [x] Cross-link bytes docs from the standard-library overview.

## 150. Standard Library Expansion: Encoding Helpers

- [x] Add a Jayess-owned `jayess:encoding` module.
- [x] Build encoding helpers on top of strings and `jayess:bytes`.
- [x] Keep the helper surface small and deterministic.
- [x] Add focused tests under `test/`.
- [x] Document the module under `docs/`.

### 150.1 Encoding Module Tasks

- [x] Add `stdlib/jayess/encoding/index.js`.
- [x] Add `base64Encode(bytes)`.
- [x] Add `base64Decode(text)`.
- [x] Add `hexEncode(bytes)`.
- [x] Add `hexDecode(text)`.
- [x] Add `uriEncode(text)`.
- [x] Add `uriDecode(text)`.
- [x] Add focused diagnostics or runtime errors for malformed encoded text.

### 150.2 Encoding Runtime Tasks

- [x] Add a focused runtime source fragment for encoding helpers.
- [x] Reuse the bytes runtime representation instead of duplicating binary storage.
- [x] Keep malformed-input handling deterministic.
- [x] Add generated-output assertions for primitive helper calls.
- [x] Add C++ compile-validation tests for base64, hex, and URI helpers.

### 150.3 Encoding Documentation Tasks

- [x] Add `docs/jayess-encoding-module.md`.
- [x] Document text and bytes argument expectations.
- [x] Document malformed-input behavior for decode helpers.
- [x] Cross-link from bytes and standard-library docs.

## 151. Standard Library Expansion: URL Helpers

- [x] Add a Jayess-owned `jayess:url` module.
- [x] Return plain Jayess objects and strings instead of ambient JavaScript `URL` instances.
- [x] Keep parsing and formatting behavior explicit and portable.
- [x] Add focused tests under `test/`.
- [x] Document URL helper semantics under `docs/`.

### 151.1 URL Module Tasks

- [x] Add `stdlib/jayess/url/index.js`.
- [x] Add `parse(text)` returning a narrow Jayess object shape.
- [x] Add `format(parts)` from the same narrow object shape.
- [x] Add `joinPath(base, path)`.
- [x] Add `getQuery(url, key)`.
- [x] Add `setQuery(url, key, value)`.
- [x] Add focused runtime validation for malformed URL text and invalid part objects.

### 151.2 URL Runtime And Tests

- [x] Add a focused runtime source fragment for URL helpers.
- [x] Keep URL parsing independent from Node.js runtime APIs.
- [x] Add module graph tests for `jayess:url`.
- [x] Add generated-output assertions for URL primitive calls.
- [x] Add C++ compile-validation tests for parse, format, path join, and query helpers.

### 151.3 URL Documentation Tasks

- [x] Add `docs/jayess-url-module.md`.
- [x] Document the returned object shape for `parse(text)`.
- [x] Document the expected input shape for `format(parts)`.
- [x] Document that this module is Jayess-owned and not ambient JavaScript `URL`.

## 152. Filesystem Expansion: Binary And Copy Helpers

- [x] Expand `jayess:fs` with focused binary and copy helpers.
- [x] Reuse `jayess:bytes` for binary payloads.
- [x] Preserve existing text filesystem helpers.
- [x] Add focused module, output, runtime-source, and compile-validation tests.
- [x] Update filesystem documentation under `docs/`.

### 152.1 Filesystem Helper Tasks

- [x] Add `readBytes(path)`.
- [x] Add `writeBytes(path, bytes)`.
- [x] Add `appendText(path, text)`.
- [x] Add `copy(fromPath, toPath)`.
- [x] Keep all filesystem writes path-scoped to explicit helper arguments.
- [x] Add runtime validation for path strings and bytes payloads.

### 152.2 Filesystem Tests And Docs

- [x] Add fixtures under `test/fixtures/modules/` for binary filesystem imports.
- [x] Add generated-output assertions for new `jayess:fs` helpers.
- [x] Add runtime-source assertions for read/write/copy helper implementations.
- [x] Add C++ compile-validation tests that import and call the new helpers.
- [x] Update `docs/jayess-fs-module.md`.
- [x] Cross-link binary helpers from `docs/jayess-bytes-module.md`.

## 153. Generator Lowering Expansion: Additional Yield Positions

- [x] Expand generator lowering for one focused set of additional `yield` positions.
- [x] Preserve existing generator frame and sent-value behavior.
- [x] Convert selected raw backend errors into semantic diagnostics before C++ emission.
- [x] Add focused semantic, output, and compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 153.1 Generator Diagnostic Tasks

- [x] Audit remaining raw generator-lowering errors in `src/cpp/emit-generator.js`.
- [x] Add semantic diagnostics for unsupported generator `yield` positions that are not implemented in this slice.
- [x] Keep direct `yield`, `yield*`, expression-yield, and class-method generator behavior unchanged.
- [x] Add semantic tests proving unsupported forms fail as `JayessError` diagnostics.

### 153.2 Generator Lowering Tasks

- [x] Lower `yield` inside `do/while` generator statements.
- [x] Lower `yield` inside `switch` generator statements.
- [x] Lower one focused `try/catch` generator shape with explicit failure propagation.
- [x] Preserve generator-frame cleanup on completion and failure.
- [x] Preserve generated C++ validity across resume labels.

### 153.3 Generator Tests And Docs

- [x] Add output tests for the new generator yield positions.
- [x] Add compile-validation tests for each supported generator shape.
- [x] Add runtime-source assertions only if generator runtime helpers change.
- [x] Update `docs/generator-lowering.md`.
- [x] Update `docs/semantics.md` and `docs/limitations.md` for the expanded generator surface.

## 154. Control Flow Expansion: `finally` Return, Break, And Continue

- [x] Implement focused control-flow support inside `finally` blocks.
- [x] Preserve current `try` / `catch` / `finally` behavior for existing supported forms.
- [x] Keep finalizer execution order explicit in generated C++.
- [x] Add focused semantic, output, and compile-validation tests under `test/`.
- [x] Update control-flow documentation under `docs/`.

### 154.1 Semantic Tasks

- [x] Update `src/semantic/finally-control-flow.js` for the first supported `finally` control-flow shape.
- [x] Add semantic validation for `return` inside `finally`.
- [x] Add semantic validation for `break` inside `finally`.
- [x] Add semantic validation for `continue` inside `finally`.
- [x] Preserve diagnostics for malformed labels or invalid loop targets.

### 154.2 C++ Lowering Tasks

- [x] Add a compact lowering strategy for `return` inside `finally`.
- [x] Add a compact lowering strategy for `break` inside `finally`.
- [x] Add a compact lowering strategy for `continue` inside `finally`.
- [x] Preserve finalizer execution before control leaves the protected block.
- [x] Avoid broad changes to unrelated statement emission.

### 154.3 Tests And Docs

- [x] Add semantic tests for valid and invalid `finally` control-flow forms.
- [x] Add generated-output tests for each supported control-flow form.
- [x] Add compile-validation tests for generated C++ with `finally` control flow.
- [x] Update `docs/semantics.md`.
- [x] Update `docs/limitations.md`.

## 155. Destructuring Expansion: Function And Method Parameters

- [x] Add destructured parameter support for functions, arrows, methods, and constructors.
- [x] Reuse existing binding-pattern parsing and destructuring emission where practical.
- [x] Preserve default-parameter and rest-parameter behavior.
- [x] Add focused parser, semantic, output, and compile-validation tests.
- [x] Update destructuring documentation under `docs/`.

### 155.1 Parser Tasks

- [x] Accept array binding patterns in parameter lists.
- [x] Accept object binding patterns in parameter lists.
- [x] Preserve identifier parameters, default parameters, rest parameters, and trailing commas.
- [x] Preserve diagnostics for invalid rest/default combinations.
- [x] Keep AST node shapes small and explicit.

### 155.2 Semantic Tasks

- [x] Register destructured parameter bindings in function scope.
- [x] Diagnose duplicate names across destructured and ordinary parameters.
- [x] Preserve arrow-function `arguments` diagnostics.
- [x] Preserve constructor and method parameter behavior.
- [x] Add tests for nested destructured parameter bindings.

### 155.3 C++ Emission Tasks

- [x] Reuse `emitDestructuringAssignments` for parameter initialization.
- [x] Evaluate each source argument exactly once.
- [x] Apply defaults according to Jayess null/missing-argument rules.
- [x] Support destructured parameters in function declarations.
- [x] Support destructured parameters in function expressions and arrow functions.
- [x] Support destructured parameters in class methods and constructors.

### 155.4 Tests And Docs

- [x] Add parser tests for array and object destructured parameters.
- [x] Add semantic tests for duplicate destructured parameter names.
- [x] Add generated-output tests for each callable form.
- [x] Add compile-validation tests for generated C++.
- [x] Update `docs/semantics.md` and `docs/limitations.md`.

## 156. Maintainability: Focused C++ Emitter Extraction

- [x] Extract one focused responsibility from `src/cpp/emit-module.js`.
- [x] Preserve generated C++ output except where tests intentionally cover feature additions.
- [x] Keep public `emitModule(...)` behavior unchanged.
- [x] Keep extracted files small and reviewable.
- [x] Run focused output and compile-validation tests after extraction.

### 156.1 Extraction Tasks

- [x] Move call expression rendering into a focused file such as `src/cpp/emit-call.js`.
- [x] Move member expression rendering into a focused file such as `src/cpp/emit-member.js`.
- [x] Pass only narrow context and rendering callbacks needed by the extracted emitters.
- [x] Preserve optional chaining and spread argument behavior.
- [x] Preserve private-member and `super` call behavior.

### 156.2 Verification Tasks

- [x] Add or update focused emitter organization tests only if coverage is missing.
- [x] Run generated snapshot tests after extraction.
- [x] Run C++ compile-validation tests after extraction.
- [x] Confirm `src/cpp/emit-module.js` is smaller and remains focused on module-level orchestration.

## 157. Documentation Synchronization For Shipped Features

- [x] Align current docs with the shipped parser, semantic, module, runtime, and C++ emitter behavior.
- [x] Remove stale limitation text that contradicts completed checklist sections.
- [x] Keep documentation descriptive and current, not aspirational.
- [x] Keep docs under `docs/` as focused markdown files.
- [x] Add or update tests only when doc cleanup exposes a behavior mismatch.

### 157.1 Documentation Audit Tasks

- [x] Compare `docs/overview.md` supported-feature bullets against current parser, semantic, and stdlib behavior.
- [x] Compare `docs/limitations.md` unsupported-feature text against completed sections `148` through `156`.
- [x] Compare `docs/javascript-feature-gaps.md` with `Jayess.md` unsupported-by-design rules.
- [x] Compare each `docs/jayess-*-module.md` file with the matching `stdlib/jayess/*/index.js` exports.
- [x] Compare `docs/semantics.md` with shipped behavior for `finally`, destructuring, async, generators, classes, and standard-library modules.

### 157.2 Documentation Update Tasks

- [x] Update stale destructured-parameter limitation text.
- [x] Update stale package-diagnostic and resolver-hardening notes.
- [x] Update standard-library overview lists to match actual `jayess:*` modules and exported helpers.
- [x] Update async and generator descriptions to match current helper modules and lowering support.
- [x] Update class and `super` descriptions to include shipped static `super.method(...)` calls and static inheritance behavior.

### 157.3 Verification Tasks

- [x] Run focused grep checks for stale phrases such as `not yet`, `unsupported`, and `next`.
- [x] Confirm unsupported-by-design language remains aligned with `Jayess.md`.
- [x] Confirm docs do not introduce new roadmap deferral text.
- [x] Run focused documentation-adjacent tests when behavior claims touch diagnostics or module resolution.

## 158. Test Infrastructure Cleanup For Portable Full Output Runs

- [x] Make the output test suite portable across the current Linux workspace and Windows-style generated paths.
- [x] Keep generated and temporary files under `./temp`.
- [x] Keep tests under `test/`.
- [x] Preserve native artifact copying behavior.
- [x] Avoid adding GitHub workflow tests or GitHub Actions files.

### 158.1 Native Artifact Fixture Tasks

- [x] Inspect `test/output/transpile-file.test.js` native library artifact tests.
- [x] Add a small test fixture artifact under `test/fixtures/modules/native/` for every copied library filename asserted by tests.
- [x] Keep fixture artifacts tiny and deterministic.
- [x] Preserve copy validation for `.dll`, `.lib`, `.so`, `.dylib`, or static-library artifacts already covered by the tests.
- [x] Add focused assertions that generated library artifacts remain under the target output directory.

### 158.2 Shared-Library Path Assertion Tasks

- [x] Inspect shared-library project layout assertions in `test/output/transpile-file.test.js`.
- [x] Replace platform-specific path suffix checks with normalized path checks.
- [x] Preserve coverage for `shared-library/jayess_exports.hpp`.
- [x] Preserve coverage for `shared-library/jayess_entry.hpp`.
- [x] Preserve coverage for `shared-library/jayess_entry.cpp`.
- [x] Preserve coverage for `shared-library/jayess_shared_library.json`.

### 158.3 Verification Tasks

- [x] Run the full `test/output/transpile-file.test.js` suite.
- [x] Run focused `transpileFile(..., { projectKind: "shared-library" })` output tests.
- [x] Confirm test output is created only under `./temp/test-output`.
- [x] Confirm no GitHub workflow or CI files are created.

## 159. Standard Library Expansion: `jayess:crypto`

- [x] Add a Jayess-owned `jayess:crypto` module for deterministic first-slice cryptographic helpers.
- [x] Build binary inputs and outputs on `jayess:bytes`.
- [x] Keep the module explicit under `jayess:*` instead of adding ambient Node.js `crypto`.
- [x] Add focused module, output, runtime-source, and compile-validation tests under `test/`.
- [x] Document the module under `docs/`.

### 159.1 Module Surface Tasks

- [x] Add `stdlib/jayess/crypto/index.js`.
- [x] Add `sha256(bytes)` returning bytes.
- [x] Add `sha1(bytes)` returning bytes if the runtime implementation can stay compact and portable.
- [x] Add `randomBytes(count)` using a portable runtime source.
- [x] Add `equals(left, right)` or reuse `jayess:bytes.equals` in examples and docs.
- [x] Keep argument validation focused on bytes inputs and numeric counts.

### 159.2 Runtime And Resolver Tasks

- [x] Add `stdlib/jayess/crypto/crypto-primitives.hpp`.
- [x] Add a focused runtime source fragment such as `src/cpp/runtime-crypto-source.js`.
- [x] Wire the runtime fragment into `src/cpp/runtime-source.js`.
- [x] Add built-in module resolution support for `jayess:crypto`.
- [x] Preserve deterministic generated C++ output.
- [x] Keep platform-specific random-source behavior isolated in the runtime fragment.

### 159.3 Tests And Docs

- [x] Add module graph tests for `jayess:crypto`.
- [x] Add generated-output assertions for crypto primitive declarations.
- [x] Add runtime-source assertions for hashing and random-byte helpers.
- [x] Add C++ compile-validation tests for importing and calling the module.
- [x] Add `docs/jayess-crypto-module.md`.
- [x] Cross-link crypto docs from `docs/overview.md` and `docs/stdlib-and-core-model.md`.

## 160. Maintainability: Continue Focused C++ Emitter Extraction

- [x] Extract one additional responsibility from `src/cpp/emit-module.js`.
- [x] Preserve generated C++ output except where tests intentionally cover a behavior fix.
- [x] Keep helper files small and reviewable.
- [x] Keep public `emitModule(...)` behavior unchanged.
- [x] Update emitter organization docs under `docs/`.

### 160.1 Assignment Extraction Tasks

- [x] Move assignment-expression rendering into a focused file such as `src/cpp/emit-assignment.js`.
- [x] Move compound-assignment rendering with it.
- [x] Preserve destructuring assignment behavior through the shared destructuring emitter.
- [x] Preserve member assignment behavior for dot, bracket, private instance, and private static targets.
- [x] Pass only narrow callbacks for expression rendering, temporary names, and private-member helpers.

### 160.2 Control-Flow Extraction Tasks

- [x] Move return, break, continue, throw, and block-statement emission into a focused helper only if it stays behavior-preserving.
- [x] Preserve `finally` control-flow signal lowering.
- [x] Preserve async return lowering.
- [x] Preserve generator handoff to `emit-generator.js`.
- [x] Avoid broad renaming while extracting.

### 160.3 Verification Tasks

- [x] Run focused generated-output tests for assignment, compound assignment, destructuring assignment, and private assignment.
- [x] Run focused compile-validation tests for assignment and class private-member output.
- [x] Run focused `finally` control-flow tests if statement emission changes.
- [x] Confirm `src/cpp/emit-module.js` line count is reduced.
- [x] Update `docs/cpp-emitter-organization.md`.

## 161. Maintainability: Parser Extraction

- [x] Extract one focused parser responsibility from `src/parser/parse.js`.
- [x] Preserve AST shapes and diagnostics.
- [x] Keep parser helper files small and reviewable.
- [x] Preserve public `parse(...)` behavior.
- [x] Add or preserve focused parser organization tests.

### 161.1 Expression Parser Extraction Tasks

- [x] Move expression parsing helpers into a focused file such as `src/parser/expressions.js`.
- [x] Preserve precedence behavior for binary, logical, nullish, ternary, assignment, update, and unary expressions.
- [x] Preserve call, member, optional-chain, and `new` expression parsing.
- [x] Preserve arrow-function detection and parser backtracking behavior.
- [x] Pass only narrow parser callbacks and token helpers into the extracted module.

### 161.2 Statement Parser Extraction Tasks

- [x] Move statement parsing helpers into a focused file such as `src/parser/statements.js` only after expression extraction is stable.
- [x] Preserve declarations, loops, switch, try/catch/finally, throw, return, break, and continue parsing.
- [x] Preserve unsupported-by-design diagnostics for `let`, `with`, dynamic `import()`, `eval`, and `Function`.
- [x] Preserve binding-pattern parsing behavior for declarations and destructuring assignment.
- [x] Avoid broad formatting or AST field renames.

### 161.3 Verification Tasks

- [x] Run parser organization tests.
- [x] Run parser tests for functions, classes, destructuring, optional chaining, generators, async, and modules.
- [x] Run semantic tests that depend on parser diagnostics.
- [x] Confirm `src/parser/parse.js` line count is reduced.
- [x] Update parser organization docs if a focused docs file exists or add one under `docs/`.

## 162. Generator And Async Lowering Expansion

- [x] Expand Jayess-owned generator and async behavior through explicit lowering and runtime helpers.
- [x] Keep JavaScript `Promise` unsupported by design.
- [x] Keep async behavior based on Jayess-owned async handles.
- [x] Keep tests focused under `test/`.
- [x] Update docs under `docs/`.

### 162.1 Generator Lowering Tasks

- [x] Add semantic diagnostics for remaining unsupported generator `try/finally` shapes before C++ emission.
- [x] Add one focused supported generator `try/finally` lowering shape.
- [x] Preserve direct `yield`, `yield*`, expression-yield, switch-yield, and do/while-yield behavior.
- [x] Preserve generator failure propagation through Jayess thrown-value paths.
- [x] Add compile-validation tests for the new generator shape.

### 162.2 Async Module Initialization Tasks

- [x] Define the generated C++ shape for module-level async initialization.
- [x] Preserve parser coverage for `await` expressions and semantic rejection for top-level `await`.
- [x] Add module graph ordering tests for async initialization dependencies.
- [x] Add C++ lowering support for async module initialization handles.
- [x] Preserve closed compile-time module graph resolution.

### 162.3 Async Runtime Tasks

- [x] Use focused async runtime helpers required by the lowering slice.
- [x] Preserve existing `jayess:async` helpers: `resolved`, `rejected`, `all`, `allSettled`, `any`, `race`, and `isAsync`.
- [x] Preserve runtime-source assertions for async helpers used by module-init lowering.
- [x] Add compile-validation tests for async composition and error propagation.
- [x] Update `docs/jayess-async-module.md`, `docs/semantics.md`, and `docs/limitations.md`.

---


## 163. Documentation Synchronization For Current Standard Library

- [x] Align public documentation with the currently shipped `jayess:*` standard-library modules.
- [x] Keep documentation descriptive and current.
- [x] Keep documentation under `docs/`.
- [x] Keep checklist and roadmap language focused on implementation progress.
- [x] Add tests only when documentation review exposes an implementation mismatch.

### 163.1 Standard-Library Export Audit Tasks

- [x] Compare each `stdlib/jayess/*/index.js` export list against its matching `docs/jayess-*-module.md` file.
- [x] Compare nested collection modules under `stdlib/jayess/collections/` against `docs/jayess-map-module.md` and `docs/jayess-set-module.md`.
- [x] Compare `docs/overview.md` standard-library bullets against the shipped `stdlib/jayess/` module set.
- [x] Compare `docs/stdlib-and-core-model.md` built-in namespace examples against the shipped module set.
- [x] Compare `docs/jayess-system-modules.md` against current `jayess:fs`, `jayess:path`, `jayess:process`, `jayess:system`, and `jayess:thread` exports.

### 163.2 Documentation Update Tasks

- [x] Update filesystem docs for `readBytes`, `writeBytes`, `appendText`, and `copy`.
- [x] Update system-module docs for `jayess:system` and `jayess:thread` if they are missing or stale.
- [x] Update async docs to include the full shipped `jayess:async` composition surface.
- [x] Update regex docs to match shipped flag support and helper behavior.
- [x] Update overview links and module lists so users can find every shipped module doc.

### 163.3 Verification Tasks

- [x] Run focused text scans for stale phrases that contradict shipped behavior.
- [x] Confirm docs still keep unsupported-by-design rules aligned with `Jayess.md` and `Agents.md`.
- [x] Confirm no GitHub workflow or CI files are added.
- [x] Confirm no module graph or output tests are required because no implementation mismatch was corrected.

## 164. Standard Library Expansion: `jayess:assert`

- [x] Add a Jayess-owned `jayess:assert` module for explicit program assertions.
- [x] Keep assertion behavior module-owned instead of ambient global behavior.
- [x] Keep implementation small and reviewable.
- [x] Add focused module, output, runtime-source, and compile-validation tests under `test/`.
- [x] Document the module under `docs/`.

### 164.1 Module Surface Tasks

- [x] Add `stdlib/jayess/assert/index.js`.
- [x] Add `ok(value)` for Jayess truthiness assertions.
- [x] Add `equal(left, right)` using Jayess equality semantics.
- [x] Add `notEqual(left, right)` using Jayess equality semantics.
- [x] Add `fail(message)` for explicit assertion failure.
- [x] Add `throws(callback)` for Jayess callable failure assertions.
- [x] Keep optional message handling compact and consistent across helpers.

### 164.2 Runtime And Resolver Tasks

- [x] Confirm no native `assert-primitives.hpp` bridge is required for this Jayess-source slice.
- [x] Reuse existing Jayess thrown-value paths for assertion failures where practical.
- [x] Confirm no focused runtime source fragment is required because Jayess source expresses the helper safely.
- [x] Wire `jayess:assert` into built-in module resolution.
- [x] Preserve deterministic generated C++ output.
- [x] Keep assertion helpers independent from JavaScript `Error` or Node.js `assert`.

### 164.3 Tests And Docs

- [x] Add a fixture under `test/fixtures/modules/assert-main.js`.
- [x] Add module graph tests for `jayess:assert`.
- [x] Add generated-output assertions for emitted assert module.
- [x] Confirm runtime-source assertions are not required because no runtime fragment is introduced.
- [x] Add C++ compile-validation tests for importing and calling assertion helpers.
- [x] Add `docs/jayess-assert-module.md`.
- [x] Cross-link assert docs from `docs/overview.md` and `docs/stdlib-and-core-model.md`.

## 165. Standard Library Expansion: Array Search And Ordering Helpers

- [x] Expand `jayess:array` with a focused helper family for search predicates and ordering.
- [x] Preserve existing array helper behavior.
- [x] Keep helpers Jayess-owned and explicit under `jayess:array`.
- [x] Add focused tests under `test/`.
- [x] Update array documentation under `docs/`.

### 165.1 Array Search Helper Tasks

- [x] Add `find(items, callback)`.
- [x] Add `findIndex(items, callback)`.
- [x] Add `some(items, callback)`.
- [x] Add `every(items, callback)`.
- [x] Preserve callback invocation order and single evaluation of array elements.
- [x] Preserve Jayess truthiness rules for predicate results.

### 165.2 Array Ordering Helper Tasks

- [x] Add `reverse(items)` with a clear return-value policy matching existing module style.
- [x] Add `sort(items, ...callback)` with default deterministic value ordering.
- [x] Support an optional comparator callback only if it stays compact and compile-valid.
- [x] Keep ordering behavior explicit for mixed Jayess value kinds.
- [x] Add focused runtime validation for non-array inputs and invalid callbacks.

### 165.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/array-main.js` or a focused new fixture.
- [x] Add generated-output assertions for new helper primitive calls if primitives are required.
- [x] Add runtime-source assertions for any new native helper.
- [x] Add C++ compile-validation tests for search helpers.
- [x] Add C++ compile-validation tests for ordering helpers.
- [x] Update `docs/jayess-array-module.md`.

## 166. Standard Library Expansion: String Replacement And Padding Helpers

- [x] Expand `jayess:string` with focused text transformation helpers.
- [x] Preserve existing string helper behavior.
- [x] Keep helpers explicit under `jayess:string`.
- [x] Add focused tests under `test/`.
- [x] Update string documentation under `docs/`.

### 166.1 String Replacement Tasks

- [x] Add `replaceFirst(text, search, replacement)` for plain string search values.
- [x] Add `replaceAll(text, search, replacement)` for plain string search values.
- [x] Preserve existing `jayess:regex` replacement helpers for regex-value replacement.
- [x] Keep callback replacement outside this slice.
- [x] Add runtime validation for string inputs and replacement values.

### 166.2 String Formatting Tasks

- [x] Add `padStart(text, length, ...fill)`.
- [x] Add `padEnd(text, length, ...fill)`.
- [x] Add `repeat(text, count)`.
- [x] Add `toLower(text)`.
- [x] Add `toUpper(text)`.
- [x] Keep Unicode behavior documented according to the implemented runtime behavior.

### 166.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/string-main.js` or a focused new fixture.
- [x] Add generated-output assertions for new helper primitive calls if primitives are required.
- [x] Add runtime-source assertions for replacement and padding helpers.
- [x] Add C++ compile-validation tests for replacement helpers.
- [x] Add C++ compile-validation tests for padding and case helpers.
- [x] Update `docs/jayess-string-module.md`.

## 167. Regex And String Composition Expansion

- [x] Improve composition between `jayess:regex` and text helpers.
- [x] Preserve regex literal and ambient `RegExp` exclusions from Jayess language rules.
- [x] Keep helper behavior module-owned.
- [x] Add focused tests under `test/`.
- [x] Update regex and string documentation under `docs/`.

### 167.1 Regex Helper Tasks

- [x] Add `split(regex, text)` to `jayess:regex`.
- [x] Add `matchAll(regex, text)` returning a Jayess array of match arrays.
- [x] Preserve existing `create`, `test`, `exec`, `replaceFirst`, `replaceAll`, and `isRegex`.
- [x] Preserve shipped flag validation for `i`, `m`, and `s`.
- [x] Add runtime validation for regex and text arguments.

### 167.2 String Integration Tasks

- [x] Allow `jayess:string.replaceFirst` to accept a shipped regex value if section 166 introduces that helper.
- [x] Allow `jayess:string.replaceAll` to accept a shipped regex value if section 166 introduces that helper.
- [x] Keep plain string and regex replacement behavior distinguishable in the runtime.
- [x] Preserve string-only behavior when no regex module is imported.
- [x] Avoid adding regex literal syntax.

### 167.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/regex-main.js` or a focused new fixture.
- [x] Add generated-output assertions for regex/string primitive calls.
- [x] Add runtime-source assertions for split and match-all helpers.
- [x] Add C++ compile-validation tests for regex split and match-all usage.
- [x] Update `docs/jayess-regex-module.md`.
- [x] Update `docs/jayess-string-module.md` if string integration lands.

## 168. Module Resolver Diagnostics And Dependency Metadata Hardening

- [x] Improve generated module graph diagnostics and dependency metadata.
- [x] Preserve closed compile-time module resolution.
- [x] Preserve explicit rejection of `node:*`, dynamic `import()`, and runtime source loading.
- [x] Keep resolver changes focused under `src/modules/` and output metadata code.
- [x] Add focused tests under `test/`.

### 168.1 Resolver Diagnostic Tasks

- [x] Add diagnostics that include the package root for invalid package entries.
- [x] Add diagnostics that include the selected `package.json` field when package entry resolution fails.
- [x] Add diagnostics that distinguish unsupported conditional exports from missing package entries.
- [x] Preserve existing relative import and built-in module diagnostics.
- [x] Preserve import-cycle diagnostics and module graph ordering behavior.

### 168.2 Dependency Metadata Tasks

- [x] Extend generated dependency metadata with resolved package roots.
- [x] Record selected package entry files in generated metadata.
- [x] Record built-in `jayess:*` modules included in the generated graph.
- [x] Preserve path safety so generated metadata never points outside the target directory except as source references.
- [x] Keep metadata deterministic across repeated runs.

### 168.3 Tests And Docs

- [x] Add package fixture tests for invalid entries with clear root and field diagnostics.
- [x] Add output tests for generated dependency metadata.
- [x] Add tests proving generated files stay under the target output directory.
- [x] Update module-resolution docs under `docs/`.
- [x] Confirm no GitHub workflow or CI files are added.

## 169. Generator Lowering Expansion: Broader Focused `try` Shapes

- [x] Expand generator lowering for one focused family of `try` statement shapes.
- [x] Preserve current direct `yield`, `yield*`, expression-yield, loop-yield, switch-yield, and focused `try` behavior.
- [x] Keep unsupported generator shapes diagnosed before C++ emission.
- [x] Add focused semantic, output, and compile-validation tests under `test/`.
- [x] Update generator documentation under `docs/`.

### 169.1 Generator Semantic Tasks

- [x] Accept a focused generator `try/finally` shape with non-yielding statements before the direct `yield`.
- [x] Accept a focused generator `try/finally` shape with non-yielding statements after resume when generated C++ control flow remains valid.
- [x] Accept a focused generator `try/catch` shape with non-yielding setup statements before the final direct `yield`.
- [x] Preserve diagnostics for handlers or finalizers that contain `yield` outside supported shapes.
- [x] Preserve generator failure propagation through Jayess thrown-value paths.

### 169.2 Generator C++ Lowering Tasks

- [x] Extend `src/cpp/emit-generator.js` without broad rewrites.
- [x] Keep resume labels outside invalid C++ protected regions.
- [x] Preserve sent-value resume behavior.
- [x] Preserve generated C++ validity across switch labels and local initialization.
- [x] Add helper functions only when they keep generator emission smaller and clearer.

### 169.3 Tests And Docs

- [x] Add semantic tests for newly accepted generator `try` shapes.
- [x] Add semantic tests for still-rejected generator `try` shapes.
- [x] Add generated-output tests for resume labels and finalizer placement.
- [x] Add C++ compile-validation tests for each new supported shape.
- [x] Update `docs/generator-lowering.md`, `docs/semantics.md`, and `docs/limitations.md`.

## 170. Async Runtime Expansion: Jayess-Owned Sleep And Timeout Helpers

- [x] Expand Jayess-owned async composition without introducing JavaScript `Promise`.
- [x] Keep behavior based on Jayess async handles.
- [x] Keep helper surface explicit under `jayess:async`.
- [x] Add focused tests under `test/`.
- [x] Update async documentation under `docs/`.

### 170.1 Async Module Surface Tasks

- [x] Add `sleep(milliseconds)` returning a Jayess async handle.
- [x] Add `timeout(handle, milliseconds)` if it can be implemented with compact runtime support.
- [x] Preserve `resolved`, `rejected`, `all`, `allSettled`, `any`, `race`, and `isAsync`.
- [x] Add runtime validation for numeric duration inputs.
- [x] Keep scheduler behavior deterministic enough for compile-validation tests.

### 170.2 Runtime Tasks

- [x] Extend `src/cpp/runtime-async-source.js` with focused helper primitives.
- [x] Keep blocking and scheduling behavior documented according to implementation.
- [x] Preserve async completion, rejection, and type-checking helpers.
- [x] Avoid adding JavaScript Promise-style methods such as `then` or `catch`.
- [x] Preserve generated C++ portability.

### 170.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/async-main.js` or a focused new fixture.
- [x] Add runtime-source assertions for new async helpers.
- [x] Add generated-output assertions for primitive declarations.
- [x] Add C++ compile-validation tests for `sleep`.
- [x] Add C++ compile-validation tests for `timeout` if implemented.
- [x] Update `docs/jayess-async-module.md`, `docs/overview.md`, and `docs/limitations.md`.

## 171. Maintainability: Continue Focused C++ Emitter Extraction

- [x] Extract one additional responsibility from `src/cpp/emit-module.js`.
- [x] Preserve generated C++ output except where tests intentionally cover a behavior fix.
- [x] Keep helper files small and reviewable.
- [x] Keep public `emitModule(...)` behavior unchanged.
- [x] Update emitter organization docs under `docs/`.

### 171.1 Module Import And Export Extraction Tasks

- [x] Move import binding collection or rendering into a focused emitter helper.
- [x] Move export alias rendering or default export rendering into a focused emitter helper.
- [x] Preserve module initialization ordering.
- [x] Preserve generated header declarations and source definitions.
- [x] Preserve shared-library output behavior.

### 171.2 Module Initialization Extraction Tasks

- [x] Move `jayess_module_init()` emission into a focused helper if it stays behavior-preserving.
- [x] Move `jayess_module_init_async()` emission into the same focused helper if it keeps the boundary clear.
- [x] Preserve top-level statement emission behavior.
- [x] Preserve module-global declarations and runtime include behavior.
- [x] Avoid broad renaming while extracting.

### 171.3 Verification Tasks

- [x] Run focused output tests for module imports, exports, default exports, and re-exports.
- [x] Run focused output tests for multi-module headers and module init declarations.
- [x] Run compile-validation tests for generated projects with imports and exports.
- [x] Confirm `src/cpp/emit-module.js` line count is reduced.
- [x] Update `docs/cpp-emitter-organization.md`.

## 172. Maintainability: Continue Focused Semantic Analyzer Extraction

- [x] Extract one focused responsibility from `src/semantic/analyze.js`.
- [x] Preserve semantic diagnostics and source locations.
- [x] Keep helper files small and reviewable.
- [x] Preserve public `analyzeModule(...)` behavior.
- [x] Add or preserve focused tests under `test/semantic/`.

### 172.1 Statement Semantic Extraction Tasks

- [x] Move statement walking helpers into a focused semantic module if it stays behavior-preserving.
- [x] Preserve loop, switch, try/catch/finally, throw, return, break, and continue diagnostics.
- [x] Preserve yield and await legality checks.
- [x] Preserve finally control-flow validation.
- [x] Pass only narrow scope and diagnostic callbacks into the extracted module.

### 172.2 Import And Export Semantic Extraction Tasks

- [x] Move import/export semantic validation into a focused helper if coverage is stable.
- [x] Preserve duplicate export diagnostics.
- [x] Preserve default export diagnostics.
- [x] Preserve unsupported import-form diagnostics.
- [x] Preserve module surface behavior for named, default, namespace, and re-export forms.

### 172.3 Verification Tasks

- [x] Run semantic tests for unsupported syntax diagnostics.
- [x] Run semantic tests for imports and exports.
- [x] Run semantic tests for async, generators, classes, destructuring, and control flow.
- [x] Confirm `src/semantic/analyze.js` line count is reduced.
- [x] Update semantic organization docs if a focused docs file exists or add one under `docs/`.

## Archived Active Checklist 2026-05-20

## 173. Generated Standard-Library Output Shape

- [x] Preserve imported `jayess:*` standard-library module identity in generated output paths.
- [x] Keep generated stdlib files under `targetDirname` and inside path-safety checks.
- [x] Keep user modules, package modules, runtime files, native copied files, and stdlib generated files distinguishable.
- [x] Preserve deterministic output names across repeated `transpileFile(...)` runs.
- [x] Update generated project documentation under `docs/`.

### 173.1 Output Path Planning Tasks

- [x] Extend output path planning so repository-owned `stdlib/jayess/*` sources emit under a generated stdlib directory.
- [x] Keep generated stdlib module stems stable and readable.
- [x] Preserve current path planning for user source files and package source files.
- [x] Preserve `ensureInsideTarget(...)` checks for every generated stdlib header and source file.
- [x] Add tests proving generated stdlib output never writes outside `targetDirname`.

### 173.2 Dependency Metadata Tasks

- [x] Record generated stdlib header/source paths in `jayess_dependency_plan.json`.
- [x] Record whether a dependency is a repository stdlib module, package module, relative module, or native artifact.
- [x] Preserve package metadata already emitted for package imports.
- [x] Preserve built-in `jayess:*` source strings and resolved source filenames.
- [x] Keep metadata deterministic for repeated generated projects.

### 173.3 Tests And Docs

- [x] Add output tests for generated stdlib layout using `jayess:string`.
- [x] Add output tests for generated stdlib layout using `jayess:async`.
- [x] Add output tests for generated stdlib layout using `jayess:fs`.
- [x] Add compile-validation tests proving generated projects still compile with the new stdlib layout.
- [x] Update `docs/generated-project-shape.md` and `docs/builtin-module-policy.md`.

## 174. Runtime Fragment Pruning For Generated Projects

- [x] Emit only runtime fragments required by the closed module graph and detected language features.
- [x] Preserve the always-required core value/runtime helpers.
- [x] Keep generated runtime source deterministic.
- [x] Keep fragment selection explicit and testable.
- [x] Update generated runtime documentation under `docs/`.

### 174.1 Runtime Feature Detection Tasks

- [x] Add a focused runtime feature analysis pass for parsed module graphs.
- [x] Detect async functions, `await`, async module initialization, and imported `jayess:async`.
- [x] Detect generators, `yield`, `yield*`, and imported iterator helpers.
- [x] Detect class inheritance, private members, maps, sets, bytes, regex, and other runtime-backed values.
- [x] Keep detection independent from C++ emission side effects.

### 174.2 Runtime Writer Tasks

- [x] Split runtime writing so core fragments are always emitted and optional fragments are selected by feature flags.
- [x] Preserve current full-runtime behavior for tests that intentionally request all fragments.
- [x] Keep runtime header declarations and runtime source definitions in sync.
- [x] Preserve compile validity when multiple optional fragments depend on one another.
- [x] Keep fragment dependency rules small and documented in code.

### 174.3 Tests And Docs

- [x] Add output tests proving a simple arithmetic module emits no unused async/generator stdlib runtime fragments.
- [x] Add output tests proving `jayess:regex` imports include regex runtime fragments.
- [x] Add output tests proving generator syntax includes generator runtime fragments.
- [x] Add compile-validation tests for a minimal project and a mixed stdlib project.
- [x] Update `docs/generated-project-shape.md` with runtime pruning behavior.

## 175. Package Resolution Expansion: Jayess Package Condition

- [x] Support a Jayess-specific package export condition for package imports.
- [x] Preserve closed compile-time package resolution.
- [x] Preserve existing package diagnostics for missing packages, invalid targets, and unsupported targets.
- [x] Record selected package condition metadata in generated dependency plans.
- [x] Add package fixture tests under `test/fixtures/package-project/`.

### 175.1 Resolver Tasks

- [x] Accept package `exports` objects containing a direct `"jayess"` condition.
- [x] Prefer `"jayess"` over `"import"` and `"default"` when resolving Jayess package imports.
- [x] Preserve current direct string target support for package `exports`.
- [x] Preserve current narrow `"import"` and `"default"` target support.
- [x] Keep unsupported conditional export diagnostics focused and source-specific.

### 175.2 Metadata Tasks

- [x] Record the selected package export condition in dependency metadata.
- [x] Record selected package export key, package field, package root, and main field as currently supported.
- [x] Preserve deterministic package metadata ordering.
- [x] Add dependency-plan tests for packages using `"jayess"`.
- [x] Add dependency-plan tests for packages falling back to `"default"`.

### 175.3 Tests And Docs

- [x] Add package fixtures for root `"jayess"` exports.
- [x] Add package fixtures for subpath `"jayess"` exports.
- [x] Add package fixtures for `"jayess"` targets outside the package root and assert diagnostics.
- [x] Add compile-validation tests for package imports resolved through `"jayess"`.
- [x] Update module-resolution docs under `docs/`.

## 176. Async Runtime Timer Queue

- [x] Replace blocking async sleep scheduling with a small Jayess-owned timer queue.
- [x] Preserve JavaScript `Promise` as unsupported by design.
- [x] Preserve `jayess:async` handle semantics.
- [x] Keep public async helper names unchanged.
- [x] Add deterministic tests under `test/`.

### 176.1 Runtime Timer Tasks

- [x] Add timer records to the async scheduler runtime.
- [x] Add scheduler logic that resolves due timers without blocking before they are due.
- [x] Keep `sleep(milliseconds)` returning a Jayess async handle that resolves to Jayess null.
- [x] Keep `timeout(handle, milliseconds)` returning a Jayess async handle that rejects with the timeout message when the timer wins.
- [x] Preserve runtime validation for non-negative integer duration inputs.

### 176.2 Scheduler Integration Tasks

- [x] Keep queued continuations and timer completions processed by one Jayess-owned scheduler path.
- [x] Preserve `await` behavior for already-resolved and already-rejected handles.
- [x] Preserve async composition helpers `all`, `allSettled`, `any`, and `race`.
- [x] Keep scheduler behavior portable across supported C++ environments.
- [x] Avoid adding Promise-style `then`, `catch`, or `finally` handle methods.

### 176.3 Tests And Docs

- [x] Add runtime-source assertions for timer queue structures and scheduler behavior.
- [x] Add generated-output assertions for async timer primitives.
- [x] Add compile-validation tests for `sleep(0)`.
- [x] Add compile-validation tests for `timeout(resolved(value), milliseconds)`.
- [x] Update `docs/jayess-async-module.md` and `docs/semantics.md`.

## 177. Standard Library Expansion: Default-Async `jayess:fs`

- [x] Make `jayess:fs` default file operations return Jayess async handles.
- [x] Add synchronous filesystem variants with `Sync` suffixes.
- [x] Preserve Jayess-owned async handles instead of JavaScript `Promise`.
- [x] Keep filesystem helper names explicit and Node-like without importing `node:*`.
- [x] Add focused tests and docs under `test/` and `docs/`.

### 177.1 Async Filesystem Surface Tasks

- [x] Add default async `readText(path)` returning a Jayess async handle.
- [x] Add default async `readBytes(path)` returning a Jayess async handle.
- [x] Add default async `writeText(path, text)` returning a Jayess async handle.
- [x] Add default async `writeBytes(path, bytes)` returning a Jayess async handle.
- [x] Add default async `appendText(path, text)` returning a Jayess async handle.
- [x] Add default async `copy(fromPath, toPath)` returning a Jayess async handle.
- [x] Add default async `createDirectories(path)` returning a Jayess async handle.
- [x] Add default async `remove(path)` returning a Jayess async handle.
- [x] Add default async `rename(fromPath, toPath)` returning a Jayess async handle.
- [x] Add default async `list(path)` returning a Jayess async handle.
- [x] Add default async `stat(path)` returning a Jayess async handle.
- [x] Keep `exists(path)` behavior explicit by choosing and documenting its async handle result.

### 177.2 Synchronous Filesystem Surface Tasks

- [x] Add `readTextSync(path)` matching current synchronous `readText(path)` behavior.
- [x] Add `readBytesSync(path)` matching current synchronous `readBytes(path)` behavior.
- [x] Add `writeTextSync(path, text)` matching current synchronous `writeText(path, text)` behavior.
- [x] Add `writeBytesSync(path, bytes)` matching current synchronous `writeBytes(path, bytes)` behavior.
- [x] Add `appendTextSync(path, text)` matching current synchronous `appendText(path, text)` behavior.
- [x] Add `copySync(fromPath, toPath)` matching current synchronous `copy(fromPath, toPath)` behavior.
- [x] Add `createDirectoriesSync(path)` matching current synchronous `createDirectories(path)` behavior.
- [x] Add `removeSync(path)` matching current synchronous `remove(path)` behavior.
- [x] Add `renameSync(fromPath, toPath)` matching current synchronous `rename(fromPath, toPath)` behavior.
- [x] Add `listSync(path)` matching current synchronous `list(path)` behavior.
- [x] Add `statSync(path)` matching current synchronous `stat(path)` behavior.
- [x] Add `existsSync(path)` matching current synchronous `exists(path)` behavior.

### 177.3 Runtime And Migration Tasks

- [x] Add async filesystem runtime primitives that wrap synchronous filesystem operations in Jayess async handles.
- [x] Preserve existing native filesystem validation and error propagation paths.
- [x] Update existing stdlib fixtures from synchronous names to `Sync` names where synchronous behavior is required.
- [x] Add new fixtures that use default async filesystem functions with `await`.
- [x] Preserve generated C++ portability across path separator conventions.

### 177.4 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/fs-async-main.js`.
- [x] Update existing filesystem fixtures to cover `Sync` variants.
- [x] Add runtime-source assertions for async filesystem primitives.
- [x] Add output tests for emitted async and sync filesystem primitive declarations.
- [x] Add C++ compile-validation tests for async filesystem helpers.
- [x] Add C++ compile-validation tests for `Sync` filesystem helpers.
- [x] Update `docs/jayess-fs-module.md`, `docs/jayess-system-modules.md`, and `docs/overview.md`.

## 178. Standard Library Expansion: `jayess:os`

- [x] Add a Jayess-owned operating-system information module.
- [x] Keep OS behavior explicit and portable.
- [x] Keep the module under `stdlib/jayess/os/`.
- [x] Add focused native bridge helpers only for the supported surface.
- [x] Document the module under `docs/`.

### 178.1 Module Surface Tasks

- [x] Add `platform()` returning a Jayess string for the current platform family.
- [x] Add `arch()` returning a Jayess string for the compiled architecture family.
- [x] Add `homeDir()` returning a Jayess string for the current user home directory or Jayess null.
- [x] Add `tmpDir()` returning a Jayess string for the temporary directory.
- [x] Add `hostname()` returning a Jayess string where supported or Jayess null.
- [x] Add `newline()` returning the platform newline string.

### 178.2 Runtime Tasks

- [x] Add `src/cpp/runtime-os-source.js` with focused OS helper primitives.
- [x] Add `stdlib/jayess/os/os-primitives.hpp` bridge helpers.
- [x] Wire OS runtime fragments into generated runtime output.
- [x] Keep platform-specific code isolated inside OS runtime helpers.
- [x] Preserve deterministic compile behavior on available local compilers.

### 178.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/os-main.js`.
- [x] Add runtime-source assertions for OS helper declarations and definitions.
- [x] Add output tests for generated `jayess:os` module files.
- [x] Add C++ compile-validation tests for importing and calling `jayess:os`.
- [x] Add `docs/jayess-os-module.md` and cross-link from overview docs.

## 179. Standard Library Expansion: Time And Duration Helpers

- [x] Add small Jayess-owned time/duration helpers for native programs.
- [x] Keep duration values explicit as milliseconds.
- [x] Keep helper behavior independent from JavaScript `Date` globals.
- [x] Reuse existing date/async/thread concepts where appropriate.
- [x] Document the module under `docs/`.

### 179.1 Module Surface Tasks

- [x] Add `jayess:time` module under `stdlib/jayess/time/`.
- [x] Add `millis()` returning a monotonic millisecond timestamp.
- [x] Add `seconds(value)` returning milliseconds.
- [x] Add `minutes(value)` returning milliseconds.
- [x] Add `elapsed(start)` returning elapsed milliseconds from a monotonic start value.
- [x] Add `formatDuration(milliseconds)` returning a compact Jayess string.

### 179.2 Runtime Tasks

- [x] Add focused runtime helpers for monotonic clock values.
- [x] Add numeric validation for duration inputs.
- [x] Keep wall-clock date behavior inside `jayess:date`.
- [x] Keep monotonic duration behavior inside `jayess:time`.
- [x] Preserve generated C++ portability.

### 179.3 Tests And Docs

- [x] Add fixture coverage under `test/fixtures/modules/time-main.js`.
- [x] Add runtime-source assertions for time helper primitives.
- [x] Add generated-output assertions for `jayess:time`.
- [x] Add C++ compile-validation tests for `jayess:time`.
- [x] Add `docs/jayess-time-module.md` and cross-link from overview docs.

## 180. Generator Lowering Expansion: Additional Focused `try` Shapes

- [x] Expand generator lowering for one additional focused `try` family.
- [x] Preserve diagnostics for unsupported multi-yield or nested-yield shapes.
- [x] Preserve current direct `yield`, `yield*`, expression-yield, loop-yield, switch-yield, and focused `try` behavior.
- [x] Keep resume labels outside invalid C++ protected regions.
- [x] Add focused semantic, output, and compile-validation tests.

### 180.1 Generator Semantic Tasks

- [x] Accept a focused `try/catch` shape with one direct `yield` in the `catch` body and no `yield` in the `try` block.
- [x] Accept non-yielding setup statements before that direct catch-body `yield`.
- [x] Accept non-yielding statements after resume in the catch body when generated C++ control flow remains valid.
- [x] Preserve diagnostics for catch handlers containing multiple yields.
- [x] Preserve diagnostics for finalizers containing unsupported yields.

### 180.2 C++ Lowering Tasks

- [x] Extend `src/cpp/emit-generator.js` through a focused helper rather than broad rewrites.
- [x] Preserve sent-value resume behavior for catch-body direct yields.
- [x] Preserve Jayess thrown-value catch binding behavior.
- [x] Preserve generated C++ validity around switch labels and try/catch protected regions.
- [x] Keep helper functions small and local to generator lowering.

### 180.3 Tests And Docs

- [x] Add semantic tests for accepted catch-body direct-yield shapes.
- [x] Add semantic tests for still-rejected multi-yield catch shapes.
- [x] Add generated-output tests for catch-body resume labels.
- [x] Add C++ compile-validation tests for the accepted shape.
- [x] Update `docs/generator-lowering.md`, `docs/semantics.md`, and `docs/limitations.md`.

## 181. Diagnostics Hardening Audit

- [x] Replace remaining generic unsupported errors with focused Jayess diagnostics where practical.
- [x] Preserve unsupported-by-design rules from `Jayess.md`.
- [x] Preserve existing diagnostic source locations.
- [x] Keep diagnostics changes small and testable.
- [x] Update diagnostic documentation under `docs/`.

### 181.1 Parser Diagnostic Tasks

- [x] Audit parser generic expression-form errors and add focused messages for common user mistakes.
- [x] Audit unsupported spread/rest parser diagnostics for source specificity.
- [x] Preserve unsupported-by-design diagnostics for `let`, `with`, dynamic `import()`, `eval`, and `Function`.
- [x] Preserve parser AST shapes for accepted syntax.
- [x] Add focused parser tests for each changed diagnostic.

### 181.2 Semantic Diagnostic Tasks

- [x] Audit generator semantic diagnostics for remaining emission-time fallback cases.
- [x] Audit class and `super` semantic diagnostics for unsupported edge cases.
- [x] Audit package import semantic diagnostics for unsupported package export shapes.
- [x] Preserve diagnostic phase, filename, line, and column behavior.
- [x] Add focused semantic tests for each changed diagnostic.

### 181.3 Docs And Verification Tasks

- [x] Update `docs/diagnostics.md` with the new focused diagnostic families.
- [x] Run parser diagnostics tests.
- [x] Run semantic diagnostics tests.
- [x] Run module graph diagnostics tests.
- [x] Confirm no GitHub workflow or CI files are added.

## 182. Maintainability: Continue Runtime And Emitter Extraction

- [x] Extract one additional focused responsibility from a large runtime or emitter file.
- [x] Preserve generated C++ behavior unless a test intentionally covers a behavior fix.
- [x] Keep helper files small and reviewable.
- [x] Preserve public API behavior.
- [x] Update organization docs under `docs/`.

### 182.1 Runtime Source Extraction Tasks

- [x] Move runtime include/header assembly out of `src/cpp/runtime-source.js` into a focused helper.
- [x] Preserve runtime header content.
- [x] Preserve runtime source content.
- [x] Preserve runtime fragment ordering.
- [x] Add output tests proving runtime files remain stable for representative projects.

### 182.2 Generator Emitter Extraction Tasks

- [x] Move generator `try` lowering helpers from `src/cpp/emit-generator.js` into a focused helper if behavior remains stable.
- [x] Preserve generator expression-yield lowering.
- [x] Preserve generator local-state collection.
- [x] Preserve generator direct `yield` and `yield*` behavior.
- [x] Add focused output and compile-validation tests for generator lowering.

### 182.3 Verification Tasks

- [x] Run runtime-source output tests.
- [x] Run focused generator output tests.
- [x] Run generator compile-validation tests.
- [x] Confirm touched large files have reduced line counts.
- [x] Update `docs/cpp-emitter-organization.md`.

## 183) Scheduler-Backed Default `jayess:fs`

- [x] Inspect the current `jayess:fs` wrappers in `stdlib/jayess/fs/index.js` and the primitive bridge in `stdlib/jayess/fs/fs-primitives.hpp`.
- [x] Inspect `src/cpp/runtime-fs-source.js`, `src/cpp/runtime-async-source.js`, and `src/cpp/runtime-thread-source.js` for reusable async scheduling and worker-transfer primitives.
- [x] Add a small runtime helper that schedules filesystem work onto the Jayess async machinery and returns a Jayess async handle.
- [x] Keep default `jayess:fs` functions async-shaped: `exists`, `readText`, `readBytes`, `writeText`, `writeBytes`, `appendText`, `copy`, `createDirectories`, `remove`, `list`, `rename`, and `stat`.
- [x] Keep synchronous filesystem behavior only in the matching `Sync` suffixed functions.
- [x] Preserve binary payload behavior through `jayess:bytes` for `readBytes` / `writeBytes`.
- [x] Add focused tests under `test/` for awaiting default filesystem operations.
- [x] Add focused tests under `test/` proving `Sync` suffixed functions still return direct values.
- [x] Update `docs/jayess-fs-module.md` with the scheduler-backed default async behavior.

## 184) `jayess:stream` First Slice

- [x] Add `stdlib/jayess/stream/index.js` with a narrow Jayess-owned stream surface.
- [x] Add native bridge declarations for the stream primitive layer under `stdlib/jayess/stream/`.
- [x] Add a focused runtime source file for stream primitives under `src/cpp/`.
- [x] Register `jayess:stream` in built-in module resolution.
- [x] Export `openRead(path)` and `openWrite(path)` as default async stream creation helpers.
- [x] Export `readChunk(stream, size)` for byte-oriented reads.
- [x] Export `writeChunk(stream, bytes)` for byte-oriented writes.
- [x] Export `close(stream)` and make repeated close attempts produce a clear runtime failure.
- [x] Add tests under `test/` that read a file in chunks into `jayess:bytes`.
- [x] Add tests under `test/` that write chunks and verify the resulting file content.
- [x] Add `docs/jayess-stream-module.md`.
- [x] Link the new stream documentation from `docs/overview.md` and `docs/stdlib-and-core-model.md`.

## 185) Expanded `jayess:bytes` Binary Helpers

- [x] Inspect the current `jayess:bytes` public surface and runtime primitive ownership.
- [x] Add `fromArray(values)` for constructing bytes from numeric array values.
- [x] Add `toArray(bytes)` for exposing byte values as a Jayess array.
- [x] Add `get(bytes, index)` and `set(bytes, index, value)` helpers with explicit bounds checks.
- [x] Add `fill(bytes, value)` for filling a byte buffer.
- [x] Add `compare(left, right)` using deterministic lexicographic byte ordering.
- [x] Add `startsWith(bytes, prefix)` and `endsWith(bytes, suffix)`.
- [x] Add compile and runtime tests under `test/` for each new helper family.
- [x] Update `docs/jayess-bytes-module.md`.

## 186) `jayess:events` First Slice

- [x] Add `stdlib/jayess/events/index.js` with a Jayess-owned event-emitter surface.
- [x] Add a small runtime primitive only where Jayess source cannot safely model listener storage or callable identity.
- [x] Register `jayess:events` in built-in module resolution.
- [x] Export `create()` for constructing an emitter.
- [x] Export `on(emitter, name, callback)` for persistent listeners.
- [x] Export `once(emitter, name, callback)` for one-shot listeners.
- [x] Export `off(emitter, name, callback)` for removing a listener.
- [x] Export `emit(emitter, name, ...args)` and return the number of invoked listeners.
- [x] Export `listenerCount(emitter, name)`.
- [x] Add tests under `test/` for listener ordering, one-shot removal, explicit removal, and argument forwarding.
- [x] Add `docs/jayess-events-module.md`.
- [x] Link the new events documentation from `docs/overview.md` and `docs/stdlib-and-core-model.md`.

## 187) `jayess:async` Error-Handling Helpers

- [x] Inspect current async-handle completion and rejection propagation in `src/cpp/runtime-async-source.js`.
- [x] Add `catchError(handle, callback)` to transform a rejected async handle through a Jayess callable.
- [x] Add `finallyDo(handle, callback)` to run cleanup after either success or rejection.
- [x] Add `delay(value, milliseconds)` to resolve a value after the scheduler delay expires.
- [x] Add `retry(callback, count)` for retrying a callback that returns either a direct value or an async handle.
- [x] Preserve Jayess-owned async-handle semantics without adding JavaScript `Promise` methods.
- [x] Add tests under `test/` for resolved paths, rejected paths, cleanup ordering, and retry exhaustion.
- [x] Update `docs/jayess-async-module.md`.

## 188) `jayess:iter` Completion Helpers

- [x] Inspect current generator-handle helper behavior in `stdlib/jayess/iter/index.js` and `src/cpp/runtime-iter-source.js`.
- [x] Add `forEach(generator, callback)`.
- [x] Add `reduce(generator, callback, initial)`.
- [x] Add `some(generator, callback)`.
- [x] Add `every(generator, callback)`.
- [x] Add `find(generator, callback)`.
- [x] Add `chain(left, right)` for concatenating two generator handles.
- [x] Add `range(start, end, step)` as a Jayess-owned generator helper.
- [x] Add tests under `test/` for empty generators, early stop behavior, callback invocation, and range stepping.
- [x] Update `docs/jayess-iter-module.md`.

## 189) Generator `try` Shape Follow-Up

- [x] Inspect `src/semantic/generator-forms.js`, `src/cpp/generator-try-shapes.js`, and `src/cpp/emit-generator.js`.
- [x] Add semantic classification for generator `try` blocks containing multiple direct non-delegated `yield` expressions.
- [x] Add C++ lowering for the supported multiple-yield `try` shape.
- [x] Add semantic classification for catch bodies that contain cleanup statements and one direct non-delegated `yield`.
- [x] Add C++ lowering for the supported catch-body cleanup-plus-yield shape.
- [x] Keep unsupported generator `try` shapes diagnosed explicitly.
- [x] Add semantic tests under `test/semantic/`.
- [x] Add compile/runtime tests under `test/` for the newly supported generator shapes.
- [x] Update `docs/generator-lowering.md` and `docs/limitations.md`.

## 190) Package Resolution Hardening

- [x] Inspect `src/modules/resolve-package-import.js`, `src/modules/module-graph.js`, and `docs/module-resolution.md`.
- [x] Add package self-reference import support for package names matching the importing package.
- [x] Add focused diagnostics for unsupported package self-reference targets.
- [x] Add deterministic condition-trace metadata for selected `exports` branches.
- [x] Add tests under `test/modules/` for scoped package subpath imports.
- [x] Add tests under `test/modules/` for package self-reference imports.
- [x] Add tests under `test/modules/` for unsupported `exports` branch diagnostics.
- [x] Update `docs/module-resolution.md`.

## 191) Class-System Follow-Up

- [x] Inspect class parser, semantic, and emitter handling in `src/parser/classes.js`, `src/semantic/classes.js`, and `src/cpp/emit-class.js`.
- [x] Add parser and AST coverage for computed `super[expr](...)` call syntax when the parser does not already preserve that shape.
- [x] Add semantic validation for computed `super[expr](...)` calls inside derived instance methods.
- [x] Add C++ lowering for computed `super[expr](...)` calls.
- [x] Add semantic validation for static `super.name` reads inside derived static methods.
- [x] Add C++ lowering for static `super.name` reads.
- [x] Keep `super` assignment forms rejected with focused diagnostics.
- [x] Add parser, semantic, compile, and runtime tests under `test/`.
- [x] Update class-related notes in `docs/overview.md` and `docs/limitations.md`.

## 192) Runtime And Emitter Maintainability Slices

- [x] Extract one focused responsibility from `src/cpp/emit-module.js` without changing generated C++ behavior.
- [x] Add or update tests that prove the extracted emitter responsibility is behavior-preserving.
- [x] Extract one focused responsibility from `src/semantic/analyze.js` without changing semantic diagnostics.
- [x] Add or update tests that prove semantic diagnostics remain stable.
- [x] Extract one focused responsibility from `src/cpp/emit-generator.js` without changing supported generator output.
- [x] Add or update tests that prove generator output remains stable.
- [x] Update `docs/cpp-emitter-organization.md` or `docs/semantic-organization.md` when ownership boundaries change.

## 193) Standard Library Index Documentation

- [x] Add `docs/standard-library.md`.
- [x] List every supported `jayess:*` module and its current exports.
- [x] Document async-vs-sync naming rules for `jayess:fs`.
- [x] Document which modules use runtime primitives and which are mostly Jayess wrappers.
- [x] Document that `node:*` imports remain unsupported in Jayess source.
- [x] Link the new standard-library index from `docs/overview.md`.

## 194) Runtime Behavior Test Expansion

- [x] Add focused runtime behavior tests for `jayess:fs` async defaults.
- [x] Add focused runtime behavior tests for `jayess:thread` transfer and join behavior.
- [x] Add focused runtime behavior tests for `jayess:async` timeout and rejection composition.
- [x] Add focused runtime behavior tests for binary data flow through `jayess:bytes`, `jayess:encoding`, and `jayess:crypto`.
- [x] Keep all new tests under `test/`.
- [x] Do not add GitHub workflow tests or edit GitHub Actions workflow files.

## 195) `jayess:subprocess` First Slice

- [x] Inspect `docs/jayess-system-modules.md`, `src/modules/resolve-builtin-module.js`, and existing `jayess:process` / `jayess:thread` module patterns.
- [x] Add `stdlib/jayess/subprocess/index.js` with a narrow Jayess-owned subprocess surface.
- [x] Add native bridge declarations under `stdlib/jayess/subprocess/`.
- [x] Add a focused runtime source file under `src/cpp/` for subprocess primitives.
- [x] Register `jayess:subprocess` in built-in module resolution.
- [x] Export `run(command, args, options)` for command completion with captured `stdout`, `stderr`, and `exitCode`.
- [x] Export `spawn(command, args, options)` for explicit process handles.
- [x] Export `join(handle)` to wait for spawned process completion and return captured completion data.
- [x] Export `kill(handle)` for explicit process termination.
- [x] Keep command arguments array-based and avoid shell-by-default execution.
- [x] Keep `cwd`, `env`, `stdin`, and timeout options explicit and object-shaped.
- [x] Treat child-process environment options as per-child data, not current-process environment mutation.
- [x] Add focused diagnostics for invalid command, args, options, and handle values.
- [x] Add tests under `test/` for command completion, non-zero exit code capture, spawn/join, kill, and invalid arguments.
- [x] Add `docs/jayess-subprocess-module.md`.
- [x] Link subprocess documentation from `docs/overview.md`, `docs/standard-library.md`, and `docs/jayess-system-modules.md`.
- [x] Do not add GitHub workflow tests or edit GitHub Actions workflow files.

## 196) Test Suite Split

- [x] Inspect `test/cpp/compiler.test.js`, `test/semantic/semantic.test.js`, and `test/api/transpile.test.js` for feature-group boundaries.
- [x] Move generator compile coverage into `test/cpp/generator-compile.test.js`.
- [x] Move standard-library compile coverage into `test/cpp/stdlib-compile.test.js`.
- [x] Move class compile coverage into `test/cpp/class-compile.test.js`.
- [x] Move class semantic coverage into `test/semantic/classes.test.js`.
- [x] Move destructuring semantic coverage into `test/semantic/destructuring.test.js`.
- [x] Move generator transpile API coverage into `test/api/generator-transpile.test.js`.
- [x] Keep shared test helpers in existing helper files or add small focused helper files under `test/`.
- [x] Preserve existing assertions and fixture behavior while moving tests.
- [x] Run the moved test groups locally with the repository test command.
- [x] Do not add GitHub workflow tests or edit GitHub Actions workflow files.

## 197) Generator Lowering Completion

- [x] Inspect `src/cpp/emit-generator.js`, generator semantic checks, and current generator tests.
- [x] Add focused tests for supported generator `try` / `finally` shapes with multiple direct yields.
- [x] Implement deterministic lowering for the tested `try` / `finally` generator shapes.
- [x] Move emission-time generator diagnostics into focused semantic or lowering diagnostics where practical.
- [x] Add tests for improved generator diagnostics.
- [x] Add expression-yield tests for deterministic positions that already have stable evaluation order.
- [x] Implement the tested expression-yield positions without broad rewrites.
- [x] Keep async generators rejected with the existing Jayess-owned diagnostic policy.
- [x] Update generator documentation in `docs/` for the newly supported shapes.

## 198) `jayess:buffer` First Slice

- [x] Inspect `stdlib/jayess/bytes/`, `docs/standard-library.md`, and byte-related tests.
- [x] Add `stdlib/jayess/buffer/index.js` as a Jayess-owned higher-level byte buffer module.
- [x] Build `jayess:buffer` on top of `jayess:bytes` primitives where practical.
- [x] Export `create(size)`, `fromBytes(bytes)`, `toBytes(buffer)`, `length(buffer)`, `read(buffer, offset, size)`, `write(buffer, offset, bytes)`, and `concat(buffers)`.
- [x] Add focused diagnostics for invalid buffer handles, offsets, sizes, and byte payloads.
- [x] Register `jayess:buffer` in built-in module resolution.
- [x] Add tests under `test/` for creation, read/write, concat, bounds checks, and module emission.
- [x] Add `docs/jayess-buffer-module.md`.
- [x] Link the module from `docs/standard-library.md` and relevant standard-library architecture docs.

## 199) Network And HTTP Standard-Library Slices

- [x] Add `docs/jayess-net-module.md` describing the first `jayess:net` TCP client/server surface.
- [x] Add checklist-ready implementation notes for `connect(host, port, options)`, `listen(host, port, handler, options)`, `read(socket)`, `write(socket, data)`, and `close(socket)`.
- [x] Keep socket handles explicit and avoid ambient Node `net` compatibility.
- [x] Add planned diagnostics for invalid host, port, socket handle, and payload values.
- [x] Add `docs/jayess-http-module.md` describing the first `jayess:http` surface after `jayess:net`.
- [x] Add checklist-ready implementation notes for `request(options)`, `createServer(handler, options)`, response status, headers, and body helpers.
- [x] Keep HTTP helpers Jayess-owned and avoid ambient Node `http` compatibility.
- [x] Link planned `jayess:net` and `jayess:http` modules from `docs/standard-library.md`.

## 200) Timers Standard-Library Slice

- [x] Inspect the current Jayess async-handle model and `jayess:async` helpers.
- [x] Add `docs/jayess-timers-module.md` for a Jayess-owned timer module.
- [x] Define `sleep(milliseconds)` as the first timer helper returning a Jayess async handle.
- [x] Define `setTimeout(callback, milliseconds, args)` with explicit callback arguments.
- [x] Define `clearTimeout(handle)` for explicit timer cancellation.
- [x] Keep timer helpers under `jayess:timers`, not ambient JavaScript globals.
- [x] Add focused diagnostics for invalid durations, callbacks, args arrays, and timer handles.
- [x] Add tests under `test/` for scheduled callback execution, cancellation, and invalid arguments.
- [x] Link `jayess:timers` from `docs/standard-library.md`.

## 201) Existing Standard-Library Depth

- [x] Extend `jayess:path` with `parse(path)`, `format(parts)`, `separator()`, and `delimiter()` helpers.
- [x] Add focused path tests for parse/format round trips and host separator helpers.
- [x] Extend `jayess:fs` with directory walking and recursive copy/remove helpers.
- [x] Add filesystem tests under `test/` using temporary files under `temp/`.
- [x] Extend `jayess:crypto` with HMAC helpers and streaming hash handles.
- [x] Add crypto tests for deterministic HMAC output and chunked hash equivalence.
- [x] Extend `jayess:encoding` with focused UTF-16 and ASCII helpers.
- [x] Add encoding tests for round trips and invalid input diagnostics.
- [x] Extend `jayess:stream` with `pipe`, `copy`, and generator-style consumption helpers.
- [x] Add stream tests for pipe/copy behavior and invalid stream handle diagnostics.
- [x] Update the affected module docs in `docs/`.

## 202) Module Resolution Hardening

- [x] Inspect package resolution code and existing package diagnostics tests.
- [x] Add tests for package `exports` pattern support such as `"./features/*"`.
- [x] Implement package export pattern resolution for direct Jayess source targets.
- [x] Add diagnostics for package export patterns that resolve outside the package root.
- [x] Add directory package fallback diagnostics with trace metadata.
- [x] Record dependency-plan metadata explaining selected package branch, condition, and resolved file.
- [x] Add tests for package self-reference with export patterns.
- [x] Add tests for unsupported pattern targets and missing pattern targets.
- [x] Update package resolution docs in `docs/`.

## 203) Runtime Behavior Verification Harness

- [x] Inspect existing compile-validation helpers under `test/`.
- [x] Add a small executable harness under `test/` that compiles generated C++ and runs selected exported functions.
- [x] Keep generated temporary project files under `temp/`.
- [x] Add runtime verification for `jayess:fs` async default helpers.
- [x] Add runtime verification for `jayess:bytes` plus `jayess:encoding`.
- [x] Add runtime verification for `jayess:events`.
- [x] Add runtime verification for generator resume behavior.
- [x] Add runtime verification for class inheritance and `super`.
- [x] Keep each runtime test file focused by feature area.
- [x] Do not add GitHub workflow tests or edit GitHub Actions workflow files.

## 204) Maintainability Refactors

- [x] Split object rendering helpers out of `src/cpp/emit-module.js` into a focused source file.
- [x] Split array rendering helpers out of `src/cpp/emit-module.js` into a focused source file.
- [x] Split template-literal rendering helpers out of `src/cpp/emit-module.js` into a focused source file.
- [x] Split generator statement lowering out of `src/cpp/emit-generator.js` into a focused source file.
- [x] Split generator expression-yield lowering out of `src/cpp/emit-generator.js` into a focused source file.
- [x] Split class semantic analysis out of `src/semantic/analyze.js` into a focused source file.
- [x] Split destructuring semantic analysis out of `src/semantic/analyze.js` into a focused source file.
- [x] Preserve public module APIs during each extraction.
- [x] Run focused tests after each extraction.

## 205) Destructuring Completion

- [x] Inspect parser, semantic, and lowering support for array/object destructuring.
- [x] Add parser and semantic tests for array elisions in declarations, parameters, and assignments.
- [x] Implement array elision handling without changing existing binding order.
- [x] Add assignment destructuring tests for member targets.
- [x] Implement member-target assignment destructuring with stable left-to-right evaluation.
- [x] Add diagnostics for unsupported destructuring targets that remain outside Jayess.md.
- [x] Update destructuring documentation in `docs/`.

## 206) Class System Follow-Up

- [x] Add tests for computed static `super[expr]` calls where the key resolves to a callable static member.
- [x] Implement computed static `super[expr]` callable lookup.
- [x] Add tests for non-call computed instance `super[expr]` reads.
- [x] Implement non-call computed instance `super[expr]` reads.
- [x] Add diagnostics tests for invalid private/static member combinations.
- [x] Improve private/static diagnostics without changing supported behavior.
- [x] Add class base validation tests aligned with Jayess.md.
- [x] Update class model documentation in `docs/`.

## 207) Documentation Indexes

- [x] Add `docs/feature-matrix.md` with syntax support status and links to deeper docs.
- [x] Add `docs/standard-library-matrix.md` with module exports and required runtime primitive families.
- [x] Add `docs/unsupported-by-design.md` summarizing unsupported forms already defined by Jayess.md and Agents.md.
- [x] Add `docs/generated-project-layout.md` describing generated source, stdlib, native bridge, and metadata layout.
- [x] Link the new indexes from existing overview documentation.
- [x] Keep each index factual and concise.

## Archived Sections 208-217

## 208) Implement `jayess:net` First Slice

- [x] Add `stdlib/jayess/net/index.js` with explicit Jayess wrappers for `connect`, `listen`, `read`, `write`, and `close`.
- [x] Add `stdlib/jayess/net/net-primitives.hpp` with the narrow native bridge declarations needed by the wrapper module.
- [x] Add `src/cpp/runtime-net-source.js` for isolated portable TCP runtime support and keep platform-specific behavior inside that runtime module.
- [x] Register the `jayess:net` builtin module and runtime feature so imported net modules are emitted with generated projects.
- [x] Lower net socket and server handles as explicit runtime handle values with close behavior.
- [x] Make `connect`, `read`, and `write` return Jayess async handles instead of JavaScript Promise-style values.
- [x] Validate `host`, `port`, socket/server handles, timeout options, and byte payloads with focused Jayess runtime diagnostics.
- [x] Add compile tests under `test/cpp/` for importing and calling the `jayess:net` surface.
- [x] Add output/module tests under `test/output/` for generated runtime inclusion and dependency-plan metadata.
- [x] Add runtime tests under `test/runtime/` for a minimal loopback client/server exchange when the local host supports sockets.
- [x] Update `docs/jayess-net-module.md` with the implemented first-slice behavior and diagnostics.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md` if the export list changes during implementation.

## 209) Implement `jayess:http` First Slice

- [x] Add `stdlib/jayess/http/index.js` with explicit wrappers for `request`, `createServer`, `setStatus`, `setHeader`, `write`, and `end`.
- [x] Add `stdlib/jayess/http/http-primitives.hpp` only for native HTTP primitives that cannot be cleanly layered over `jayess:net`.
- [x] Add `src/cpp/runtime-http-source.js` if the implementation needs isolated HTTP parsing or response-writing helpers.
- [x] Register the `jayess:http` builtin module and runtime feature so imported HTTP modules are emitted with generated projects.
- [x] Implement `request(options)` with `method`, `url`, `headers`, `body`, and `timeoutMillis` option handling.
- [x] Implement response objects with explicit `statusCode`, `headers`, and `body` fields for client responses.
- [x] Implement server request/response handles without adopting Node.js stream compatibility.
- [x] Validate unsupported URL schemes, invalid status codes, invalid headers, invalid handles, and invalid body values with focused diagnostics.
- [x] Add compile tests under `test/cpp/` for HTTP imports and helper calls.
- [x] Add output/module tests under `test/output/` for generated runtime inclusion and dependency-plan metadata.
- [x] Add runtime tests under `test/runtime/` for a minimal local request/response exchange when local networking is available.
- [x] Update `docs/jayess-http-module.md` with the implemented first-slice behavior and diagnostics.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md` if the export list changes during implementation.

## 210) Deepen `jayess:subprocess`

- [x] Add streamed stdout handling from subprocess handles through `jayess:stream` without replacing the existing completion-result API.
- [x] Add streamed stderr handling from subprocess handles through `jayess:stream` without shell-by-default execution.
- [x] Add focused timeout behavior tests for `run(command, args, { timeoutMillis })`.
- [x] Add focused `kill(handle)` and `join(handle)` behavior tests for already-completed and already-killed handles.
- [x] Add result helper wrappers such as `ok(result)` and `requireSuccess(result)` in `stdlib/jayess/subprocess/index.js`.
- [x] Keep executable-plus-args invocation as the default subprocess execution model.
- [x] Add runtime diagnostics for unavailable host adapters, invalid stream access, invalid timeout values, and invalid process handles.
- [x] Add compile tests under `test/cpp/` for new subprocess helpers.
- [x] Add runtime tests under `test/runtime/` for result helpers and stream-backed subprocess output.
- [x] Update `docs/jayess-subprocess-module.md` and `docs/standard-library.md` with the new exports and behavior.

## 211) Document And Deepen `jayess:process`

- [x] Add `docs/jayess-process-module.md` describing `argv`, `cwd`, `getEnv`, and `exit`.
- [x] Add `hasEnv(name)` to `stdlib/jayess/process/index.js`.
- [x] Add `envKeys()` or `envEntries()` to expose current environment inspection without environment mutation.
- [x] Add any required narrow runtime helpers in a focused process/system runtime file.
- [x] Keep child-process environment mutation scoped to `jayess:subprocess` options and out of `jayess:process`.
- [x] Add compile tests under `test/cpp/` for the process module imports and calls.
- [x] Add output/module tests under `test/output/` for process runtime inclusion.
- [x] Add runtime tests under `test/runtime/` for `cwd`, `argv`, and environment inspection where host data is available.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md` with the final process export list.

## 212) Add Practical Higher-Level Standard Libraries

- [x] Add `jayess:cli` as a small argument parsing module layered over `jayess:process`.
- [x] Document `jayess:cli` in `docs/jayess-cli-module.md` with option, flag, and positional parsing examples.
- [x] Add `jayess:uuid` as a UUID helper module layered over `jayess:crypto`.
- [x] Document `jayess:uuid` in `docs/jayess-uuid-module.md`.
- [x] Add `jayess:hash` as higher-level string, bytes, and file hashing helpers layered over `jayess:crypto`, `jayess:bytes`, and `jayess:fs`.
- [x] Document `jayess:hash` in `docs/jayess-hash-module.md`.
- [x] Add one small config text module such as `jayess:dotenv` or `jayess:ini` with parsing and formatting helpers.
- [x] Document the config module in a focused markdown file under `docs/`.
- [x] Register each new builtin module through the existing builtin module resolution path.
- [x] Add compile tests under `test/cpp/` for each new standard-library module.
- [x] Add output/module tests under `test/output/` for generated runtime inclusion and dependency metadata.
- [x] Add runtime tests under `test/runtime/` for the pure Jayess helper behavior.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md` with the new modules.

## 213) Expand Runtime Execution Coverage

- [x] Add generated-C++ runtime tests for `jayess:subprocess` result handling.
- [x] Add generated-C++ runtime tests for `jayess:thread` spawn/join behavior.
- [x] Add generated-C++ runtime tests for `jayess:timers` sleep and timeout behavior.
- [x] Add generated-C++ runtime tests for `jayess:fs` async default helpers and `Sync` variants.
- [x] Add generated-C++ runtime tests for `jayess:stream` read/write/copy helpers.
- [x] Add generated-C++ runtime tests for `jayess:net` after the net module first slice is implemented.
- [x] Add generated-C++ runtime tests for `jayess:http` after the HTTP first slice is implemented.
- [x] Keep runtime harness helpers under `test/support/` and generated temporary files under `temp/` or test-managed temp directories.
- [x] Document runtime verification coverage in `docs/runtime-verification.md`.

## 214) Split Remaining Large Test Files

- [x] Split `test/output/transpile-file.test.js` by module graph, package resolution, runtime layout, and generated metadata coverage.
- [x] Split `test/parser/parser.test.js` by declarations, expressions, modules, classes, and control-flow parsing.
- [x] Split `test/runtime-semantics.test.js` by async, generators, classes, destructuring, and built-in runtime semantics.
- [x] Split `test/cpp/compiler.test.js` by core language compilation, module compilation, and runtime-feature compilation.
- [x] Preserve existing assertions and fixture behavior while moving tests.
- [x] Keep each new test file focused and reviewable.
- [x] Run the moved test groups with the project-local Node executable.
- [x] Update `docs/testing.md` if test organization notes need to reflect the new files.

## 215) Extract Focused C++ Emitter Helpers

- [x] Extract unary and logical expression emission from `src/cpp/emit-module.js` into a focused helper module.
- [x] Extract nullish coalescing emission from `src/cpp/emit-module.js` into the same expression helper when it shares operand handling.
- [x] Extract optional chaining emission into a focused helper module if it can be separated without changing behavior.
- [x] Extract module-level declaration emission into a focused helper module if it reduces `emit-module.js` responsibility.
- [x] Preserve generated C++ snapshots unless the extraction intentionally fixes an existing emission bug.
- [x] Add or preserve focused tests for each extracted emission path.
- [x] Update `docs/cpp-emitter-organization.md` with the new helper responsibilities.

## 216) Harden Package Resolution Metadata

- [x] Add package `"imports"` support for static `#name` specifiers resolved at transpile time.
- [x] Reject computed or runtime package import specifiers with focused diagnostics.
- [x] Add dependency-plan metadata for package condition selection and package imports resolution.
- [x] Add package fixture tests for scoped packages with export patterns.
- [x] Add package fixture tests for package self-reference plus package `"imports"` mappings.
- [x] Add diagnostics for package exports or imports that resolve outside allowed transpileable source roots.
- [x] Keep unsupported `node:*` and dynamic import behavior aligned with `Jayess.md`.
- [x] Update `docs/module-resolution.md` with package `"imports"` and metadata behavior.

## 217) Improve Generated Project Ergonomics

- [x] Add a generated module manifest that maps each Jayess import specifier to its generated C++ source/header path.
- [x] Add a generated runtime feature manifest that lists included runtime primitive families.
- [x] Add dependency graph summary metadata beside the existing dependency plan.
- [x] Keep all generated metadata deterministic for snapshot testing.
- [x] Add output tests under `test/output/` for manifest shape and deterministic ordering.
- [x] Add docs under `docs/generated-project-layout.md` or a focused companion file describing the manifests.

## 218) Deepen `jayess:http`

- [x] Inspect current `jayess:http` wrapper, native primitive header, runtime source, docs, and tests.
- [x] Add client response helpers for `text(response)`, `bytes(response)`, and `json(response)` without adopting JavaScript `Response` compatibility.
- [x] Add request body helpers for text, bytes, and JSON request payloads through explicit Jayess values.
- [x] Add server request helpers for `method(request)`, `path(request)`, `headers(request)`, and `body(request)`.
- [x] Keep HTTP parsing and serialization behavior in focused HTTP runtime helpers, not in `emit-module.js`.
- [x] Add runtime diagnostics for invalid HTTP response handles, request handles, header values, and body values.
- [x] Add compile tests under `test/cpp/` for the expanded `jayess:http` exports.
- [x] Add output/module tests under `test/output/` for generated runtime inclusion and dependency metadata.
- [x] Add runtime tests under `test/runtime/` for response body helpers and server request helper behavior.
- [x] Update `docs/jayess-http-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 219) Deepen `jayess:net`

- [x] Inspect current `jayess:net` wrapper, native primitive header, runtime source, docs, and tests.
- [x] Add connection timeout behavior for `connect(host, port, options)` using explicit `timeoutMillis`.
- [x] Add socket/server inspection helpers for local address, remote address, and port where the host runtime can provide them.
- [x] Add focused close-state checks so closed sockets and closed servers fail with clear diagnostics.
- [x] Add server accept-loop helper behavior that composes with Jayess async handles without adding Node.js stream compatibility.
- [x] Keep platform-specific socket behavior isolated in `src/cpp/runtime-net-source.js`.
- [x] Add compile tests under `test/cpp/` for expanded `jayess:net` exports.
- [x] Add output/module tests under `test/output/` for generated runtime inclusion and dependency metadata.
- [x] Add runtime tests under `test/runtime/` for timeout, closed-handle diagnostics, and local socket metadata where available.
- [x] Update `docs/jayess-net-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 220) Add Practical Text And File Standard Libraries

- [x] Add `jayess:csv` with focused `parse(text)` and `stringify(rows)` helpers for simple comma-separated records.
- [x] Add `docs/jayess-csv-module.md` with supported escaping, quoting, and newline behavior.
- [x] Add `jayess:ini` with focused `parse(text)` and `stringify(data)` helpers for sectioned config files.
- [x] Add `docs/jayess-ini-module.md` with supported section, key, value, and comment behavior.
- [x] Add `jayess:glob` layered over `jayess:fs.walk` and `jayess:path` for simple `*`, `?`, and `**` matching.
- [x] Add `docs/jayess-glob-module.md` with matching rules and filesystem traversal behavior.
- [x] Register each new builtin module through existing builtin module resolution.
- [x] Add compile tests under `test/cpp/` for each new module.
- [x] Add output/module tests under `test/output/` for generated stdlib files and dependency metadata.
- [x] Add runtime tests under `test/runtime/` for pure Jayess parsing, formatting, and glob matching behavior.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 221) Strengthen File And Stream Integration

- [x] Inspect current `jayess:fs`, `jayess:stream`, `jayess:bytes`, `jayess:encoding`, and `jayess:hash` integration points.
- [x] Add `createReadStream(path)` and `createReadStreamSync(path)` to `jayess:fs` if the sync form is required by the module naming rules.
- [x] Add `createWriteStream(path)` and `createWriteStreamSync(path)` to `jayess:fs` if the sync form is required by the module naming rules.
- [x] Add `readAllBytes(stream)` and `readAllText(stream)` helpers to `jayess:stream`.
- [x] Add stream-backed hashing helpers such as `streamSha256(stream)` and `streamSha1(stream)` to `jayess:hash`.
- [x] Keep reusable stream behavior in `jayess:stream` instead of duplicating file-loop logic across modules.
- [x] Add compile tests under `test/cpp/` for new fs, stream, and hash helpers.
- [x] Add output/module tests under `test/output/` for runtime feature inclusion and dependency metadata.
- [x] Add runtime tests under `test/runtime/` using files under test-managed temp directories.
- [x] Update `docs/jayess-fs-module.md`, `docs/jayess-stream-module.md`, `docs/jayess-hash-module.md`, and standard-library indexes.

## 222) Complete More Generator Lowering Shapes

- [x] Inspect current generator lowering diagnostics and supported shape classification.
- [x] Add tests for generator `try/finally` blocks with multiple direct non-delegated yield positions.
- [x] Implement deterministic lowering for supported multiple-yield `try/finally` shapes.
- [x] Add tests for yield in ternary branches where the yielded branch can be lowered deterministically.
- [x] Implement deterministic expression-yield lowering for supported ternary branch shapes.
- [x] Add focused diagnostics for unsupported generator shapes thrown from generator emission.
- [x] Keep async generators unsupported with diagnostics aligned to `Jayess.md`.
- [x] Add compile tests under `test/cpp/` and API output tests under `test/api/` for the new shapes.
- [x] Add runtime tests under `test/runtime/` for resume behavior across the new generator shapes.
- [x] Update `docs/generator-lowering.md` and `docs/feature-matrix.md`.

## 223) Polish Class Runtime And Diagnostics

- [x] Inspect current class parser, semantic analysis, C++ emission, runtime helpers, docs, and tests.
- [x] Add diagnostics tests for unsupported `super` property assignment forms.
- [x] Add diagnostics tests for unsupported computed private member forms that remain outside the shipped private-member slice.
- [x] Add stronger semantic validation tests for unsupported non-class base expressions.
- [x] Improve diagnostics for invalid class base, private-member, and `super` forms without expanding unsupported behavior.
- [x] Add runtime tests for static initialization order across inherited classes.
- [x] Add compile tests under `test/cpp/` for valid static initialization and inherited static lookup paths.
- [x] Keep class runtime changes inside focused class runtime and emitter helpers.
- [x] Update `docs/semantics.md`, `docs/limitations.md`, and class-related docs.

## 224) Extract Remaining Focused C++ Emission Helpers

- [x] Inspect `src/cpp/emit-module.js` and identify one statement-emission responsibility to extract.
- [x] Extract export declaration emission into a focused helper module if it preserves generated output.
- [x] Extract variable declaration statement emission into a focused helper module if it preserves generated output.
- [x] Extract `try/catch/finally` statement emission into a focused helper module if it preserves generated output.
- [x] Preserve public emitter APIs and generated C++ snapshots unless a focused bug fix is intentional.
- [x] Add or preserve focused tests for moved statement paths.
- [x] Run output snapshot tests and relevant C++ compile tests after extraction.
- [x] Update `docs/cpp-emitter-organization.md`.

## 225) Improve Generated Project Build Metadata

- [x] Inspect existing generated project manifests and shared-library layout files.
- [x] Add a deterministic generated build-hints metadata file that lists source files, include directories, runtime files, and native artifacts.
- [x] Keep build hints metadata-only and do not make the transpiler invoke a compiler or linker.
- [x] Add optional generated CMake project file only if it can be deterministic, small, and clearly external-build-system oriented.
- [x] Add output tests under `test/output/` for build metadata shape and stable ordering.
- [x] Add docs under `docs/generated-project-layout.md` or a focused companion file for build metadata consumption.
- [x] Keep generated files inside the target directory and covered by path safety checks.

## 226) Improve Diagnostics Coverage

- [x] Add focused diagnostics tests for unsupported generator lowering shapes.
- [x] Add focused diagnostics tests for invalid native header, native source, static library, and shared library imports.
- [x] Add focused diagnostics tests for invalid standard-library handle types in HTTP, net, stream, subprocess, and thread modules.
- [x] Add focused diagnostics tests for package import/export mismatch cases and unsupported package target shapes.
- [x] Improve diagnostics text only where tests expose vague or misleading messages.
- [x] Update `docs/diagnostics.md` with the new diagnostic categories.

## 227) Add Practical Web And Data Standard Libraries

- [x] Inspect existing `jayess:url`, `jayess:http`, `jayess:string`, `jayess:object`, `jayess:json`, and text-format modules for reusable helper patterns.
- [x] Add `stdlib/jayess/querystring/index.js` with `parse(text)`, `stringify(values)`, `get(values, key)`, `set(values, key, value)`, and `has(values, key)` helpers.
- [x] Keep `jayess:querystring` behavior Jayess-owned and deterministic rather than adopting browser `URLSearchParams` compatibility.
- [x] Add `docs/jayess-querystring-module.md` with encoding, repeated-key, empty-value, and malformed-input behavior.
- [x] Add `stdlib/jayess/mime/index.js` with `lookup(pathOrExtension)`, `extension(type)`, `isText(type)`, and `charset(type)` helpers.
- [x] Keep MIME mappings small, deterministic, and easy to review instead of embedding a large registry.
- [x] Add `docs/jayess-mime-module.md` with supported mappings and fallback behavior.
- [x] Add `stdlib/jayess/form/index.js` with `parseUrlEncoded(text)`, `stringifyUrlEncoded(values)`, and `field(values, key)` helpers.
- [x] Layer `jayess:form` over `jayess:querystring` where possible instead of duplicating parsing logic.
- [x] Add `docs/jayess-form-module.md` with supported `application/x-www-form-urlencoded` behavior.
- [x] Add `stdlib/jayess/toml/index.js` with focused `parse(text)` and `stringify(data)` helpers for common TOML config values.
- [x] Keep TOML support intentionally small but useful: sections, dotted keys, strings, booleans, numbers, arrays, and comments.
- [x] Add `docs/jayess-toml-module.md` with supported and rejected TOML shapes.
- [x] Add `stdlib/jayess/log/index.js` with `debug`, `info`, `warn`, `error`, `withLevel`, and `formatJson` helpers layered over `jayess:console`.
- [x] Add `docs/jayess-log-module.md` with log level, formatting, and output behavior.
- [x] Register each new builtin module through the existing builtin module resolution path.
- [x] Add module graph tests under `test/modules/` for each new `jayess:*` module.
- [x] Add output tests under `test/output/` for generated stdlib inclusion and dependency metadata.
- [x] Add compile tests under `test/cpp/` for each new module import and representative helper call.
- [x] Add runtime tests under `test/runtime/` for pure parsing, formatting, and lookup behavior.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md` with the new modules.

## 228) Deepen `jayess:http` Application Helpers

- [x] Inspect current `jayess:http`, `jayess:fs`, `jayess:path`, `jayess:mime`, `jayess:querystring`, and `jayess:json` integration points.
- [x] Add request query helper behavior that parses request URLs through `jayess:querystring`.
- [x] Add `sendText(response, text, options)` as a focused HTTP response helper.
- [x] Add `sendJson(response, value, options)` as a focused HTTP response helper layered over `jayess:json`.
- [x] Add `sendBytes(response, bytes, options)` as a focused HTTP response helper.
- [x] Add `notFound(response, message)` and `redirect(response, location, status)` helpers.
- [x] Add static file response helpers layered over `jayess:fs`, `jayess:path`, and `jayess:mime`.
- [x] Keep helper behavior in `jayess:http` and focused HTTP runtime helpers, not in C++ emitter files.
- [x] Validate invalid response handles, invalid status codes, invalid headers, invalid file paths, and unsupported body values with focused diagnostics.
- [x] Add compile tests under `test/cpp/` for the new HTTP helpers.
- [x] Add output tests under `test/output/` for dependency metadata and runtime feature inclusion.
- [x] Add runtime tests under `test/runtime/` for generated C++ local HTTP response helpers where local networking is available.
- [x] Update `docs/jayess-http-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 229) Improve Async Cancellation And Thread Coordination

- [x] Inspect current `jayess:async`, `jayess:thread`, `jayess:timers`, `jayess:subprocess`, `jayess:net`, and `jayess:http` handle behavior.
- [x] Add a narrow cancellation-token primitive surface under `jayess:async`.
- [x] Add helpers to create, cancel, inspect, and pass cancellation tokens to supported async operations.
- [x] Add timeout propagation helpers that compose with existing `timeout` and `sleep` behavior.
- [x] Add focused diagnostics for awaiting, joining, canceling, killing, or timing out invalid or completed handles.
- [x] Add `jayess:threadpool` or `jayess:workqueue` as an explicit module for bounded worker execution.
- [x] Add simple thread communication helpers such as channel create, send, receive, close, and isClosed if they fit current runtime ownership.
- [x] Keep thread and async runtime behavior isolated in focused runtime source files.
- [x] Add compile tests under `test/cpp/` for cancellation, threadpool, and channel helper imports.
- [x] Add output tests under `test/output/` for runtime feature inclusion and dependency metadata.
- [x] Add runtime tests under `test/runtime/` for cancellation, timeout propagation, threadpool execution, and channel communication.
- [x] Update `docs/jayess-async-module.md`, `docs/jayess-thread-module.md`, and standard-library indexes.

## 230) Strengthen Stream And Text Integration

- [x] Inspect current `jayess:stream`, `jayess:fs`, `jayess:net`, `jayess:http`, and `jayess:subprocess` stream handle behavior.
- [x] Add `readLines(stream)` as a stream helper with deterministic newline behavior.
- [x] Add `writeText(stream, text)` and `writeLine(stream, text)` helpers.
- [x] Add `pipeText(input, output)` for text streams where both handles support text conversion.
- [x] Add `tee(input, leftOutput, rightOutput)` for copying one input stream into two output streams.
- [x] Add stream timeout and cancellation helpers that compose with `jayess:async` cancellation tokens when implemented.
- [x] Normalize closed-stream, invalid-handle, and wrong-direction diagnostics across fs, net, HTTP, and subprocess stream sources.
- [x] Keep reusable stream behavior in `jayess:stream` instead of duplicating stream loops across modules.
- [x] Add compile tests under `test/cpp/` for new stream helpers.
- [x] Add output tests under `test/output/` for runtime feature inclusion.
- [x] Add runtime tests under `test/runtime/` using test-managed temporary files under `temp/` or test temp directories.
- [x] Update `docs/jayess-stream-module.md` and related standard-library indexes.

## 231) Add Stable Diagnostic Codes

- [x] Inspect current parser, semantic, module, emitter, and runtime diagnostic construction.
- [x] Define a small diagnostic-code naming convention such as `JY_PARSE_*`, `JY_SEMANTIC_*`, `JY_MODULE_*`, `JY_EMIT_*`, and `JY_RUNTIME_*`.
- [x] Add structured diagnostic code fields without removing current human-readable messages.
- [x] Add diagnostic categories for parser, semantic, module resolution, C++ emission, and runtime validation.
- [x] Update public API tests to ensure diagnostics still surface through `JayessError`.
- [x] Add tests proving common unsupported-by-design diagnostics have stable codes.
- [x] Add tests proving package resolution and standard-library handle diagnostics have stable codes.
- [x] Add optional JSON-friendly diagnostic serialization if it can be added without changing existing API return shapes.
- [x] Update `docs/diagnostics.md` with diagnostic code families and examples.

## 232) Expand Generated C++ Runtime Verification

- [x] Inspect current executable runtime test helpers under `test/runtime/` and `test/support/`.
- [x] Add generated-C++ runtime tests for new `jayess:querystring`, `jayess:mime`, `jayess:form`, `jayess:toml`, and `jayess:log` modules.
- [x] Add generated-C++ runtime tests for HTTP query parsing and response helper behavior.
- [x] Add generated-C++ runtime tests for stream line/text helpers.
- [x] Add generated-C++ runtime tests for async cancellation and thread coordination helpers after those helpers ship.
- [x] Add generated-C++ runtime tests for package imports that also import standard-library modules.
- [x] Keep generated temporary projects under `temp/` or test-managed temp directories.
- [x] Keep runtime test files split by feature family and reviewable.
- [x] Update `docs/runtime-verification.md` with the new runtime coverage.

## 233) Split Remaining Medium-Large Test Files

- [x] Inspect `test/semantic/semantic.test.js` and group assertions by feature family.
- [x] Move semantic builtin tests into a focused semantic builtin or core-values test file if coverage remains too broad.
- [x] Move semantic assignment/control-flow tests into focused files if that reduces mixed responsibility.
- [x] Preserve assertion text and diagnostics unless an intentional diagnostic improvement is part of the slice.
- [x] Inspect `test/api/transpile.test.js` and group assertions by API behavior, diagnostics, and generated-output shape.
- [x] Move generated-output API assertions into focused API test files.
- [x] Inspect `test/output/builtin-modules.test.js` and split standard-library output assertions by module family.
- [x] Inspect `test/runtime-stdlib-source.test.js` and split runtime source assertions by primitive family.
- [x] Keep each new test file small, focused, and under `test/`.
- [x] Run the moved test groups after each split.
- [x] Update `docs/testing.md` if test organization changes.

## 234) Extract Focused Runtime Core Helpers

- [x] Inspect `src/cpp/runtime-source.js` and identify one runtime-core responsibility to extract first.
- [x] Extract value string conversion helpers into a focused runtime source fragment if behavior can be preserved exactly.
- [x] Extract exact equality and truthiness helpers into focused runtime source fragments if behavior can be preserved exactly.
- [x] Extract array/object/destructuring helper groups only one group at a time.
- [x] Preserve generated runtime output ordering unless tests intentionally update deterministic output.
- [x] Keep runtime fragment registration in `src/cpp/runtime-fragments.js` or nearby focused runtime layout files.
- [x] Add or preserve focused runtime-source tests for each extracted helper group.
- [x] Run output runtime-fragment tests and relevant C++ compile tests after each extraction.
- [x] Update `docs/cpp-emitter-organization.md` or a focused runtime organization doc if responsibilities move.

## 235) Polish Generator And Class Edge Diagnostics

- [x] Inspect remaining generator diagnostics from semantic analysis and generator emission.
- [x] Add focused diagnostics for generator shapes that still fail during emission with generic errors.
- [x] Add deterministic generator lowering for additional `try/finally` yield shapes where surrounding statements are non-yielding and resumable.
- [x] Preserve async generator rejection aligned with `Jayess.md`.
- [x] Add API, semantic, compile, and runtime tests for each newly supported generator shape.
- [x] Inspect class diagnostics for invalid base expressions, invalid `super` assignment, and invalid private/static combinations.
- [x] Improve class diagnostics where messages are vague while preserving supported class behavior.
- [x] Add runtime tests for deeper inherited static field and static method lookup chains.
- [x] Add compile tests for supported inherited static lookup and `super` read/call combinations.
- [x] Update `docs/generator-lowering.md`, `docs/semantics.md`, `docs/limitations.md`, and `docs/feature-matrix.md`.

## 236) Deepen Runtime Handle Diagnostics

- [x] Inspect current runtime validation in `src/cpp/runtime-async-source.js`, `src/cpp/runtime-stream-source.js`, `src/cpp/runtime-net-source.js`, `src/cpp/runtime-http-source.js`, `src/cpp/runtime-subprocess-source.js`, `src/cpp/runtime-thread-source.js`, and `src/cpp/runtime-channel-source.js`.
- [x] Catalog existing invalid-handle, closed-handle, wrong-direction, completed-handle, killed-process, timeout, and cancellation error messages in a temporary note under `temp/`.
- [x] Add narrow shared runtime validation helpers only where multiple runtime files already need the same handle-state rule.
- [x] Normalize invalid handle type diagnostics across async, stream, net, HTTP, subprocess, thread, and channel primitives.
- [x] Normalize closed handle diagnostics for stream, net, HTTP response/server, subprocess, thread, and channel handles.
- [x] Normalize wrong-direction stream diagnostics for read-only and write-only stream operations.
- [x] Normalize completed async/thread/subprocess handle diagnostics for operations that cannot be repeated.
- [x] Normalize timeout and cancellation diagnostics for operations that already accept timeout or cancellation inputs.
- [x] Keep validation behavior inside focused runtime source files or narrow runtime validation helpers, not in C++ emitter files.
- [x] Add focused runtime-source tests under `test/` for each normalized diagnostic family.
- [x] Add generated-C++ runtime tests under `test/runtime/` for representative invalid-handle and closed-handle paths.
- [x] Update `docs/diagnostics.md` with runtime handle diagnostic categories and examples.
- [x] Update affected module docs only where user-visible error behavior is documented.

## 237) Add `jayess:config` Standard Library

- [x] Inspect existing `jayess:fs`, `jayess:json`, `jayess:ini`, `jayess:toml`, `jayess:dotenv`, `jayess:path`, and `jayess:object` helper surfaces.
- [x] Add `stdlib/jayess/config/index.js` as a Jayess-written module layered over existing stdlib modules.
- [x] Add `loadJson(path)`, `loadJsonSync(path)`, `loadToml(path)`, `loadTomlSync(path)`, `loadIni(path)`, `loadIniSync(path)`, `loadDotenv(path)`, and `loadDotenvSync(path)`.
- [x] Add `load(path)` and `loadSync(path)` that select JSON, TOML, INI, or dotenv parsing from deterministic file extension rules.
- [x] Add `merge(base, override)` for shallow deterministic config overlay behavior.
- [x] Add `requireKey(config, key)` and `get(config, key, fallback)` helpers using existing object helpers where possible.
- [x] Keep parsing behavior in existing JSON, INI, TOML, and dotenv modules instead of duplicating format parsers.
- [x] Register `jayess:config` through existing builtin module resolution.
- [x] Add module graph tests under `test/modules/` for `jayess:config` imports and dependencies.
- [x] Add output tests under `test/output/` for generated stdlib inclusion and dependency metadata.
- [x] Add compile tests under `test/cpp/` for representative async and sync config helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` using config files under test-managed temp directories.
- [x] Add `docs/jayess-config-module.md` with supported formats, extension selection, merge behavior, and sync/async naming.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 238) Expand Subprocess Convenience Helpers

- [x] Inspect current `jayess:subprocess`, `jayess:stream`, `jayess:bytes`, `jayess:encoding`, `jayess:json`, and `jayess:async` integration points.
- [x] Add `runText(command, args, options)` and `runTextSync(command, args, options)` if sync process execution is already supported by the runtime surface.
- [x] Add `runBytes(command, args, options)` and `runBytesSync(command, args, options)` if sync process execution is already supported by the runtime surface.
- [x] Add `runJson(command, args, options)` as a helper layered over `runText` and `jayess:json`.
- [x] Add `spawnPipeline(commands, options)` for deterministic multi-process pipeline setup if current subprocess and stream handles can support it.
- [x] Add timeout and cancellation-aware subprocess helper behavior using existing `jayess:async` primitives.
- [x] Keep shell execution opt-in through explicit options and keep executable-plus-args behavior as the default.
- [x] Add focused diagnostics for invalid command values, invalid args arrays, invalid stdin values, timeout values, and pipeline stage objects.
- [x] Add compile tests under `test/cpp/` for the new subprocess helpers.
- [x] Add output tests under `test/output/` for dependency metadata and runtime feature inclusion.
- [x] Add generated-C++ runtime tests under `test/runtime/` for text, bytes, JSON, timeout, and failure paths.
- [x] Update `docs/jayess-subprocess-module.md` and standard-library indexes.

## 239) Strengthen Package Resolution Tracing

- [x] Inspect current package resolution in `src/modules/resolve-package-import.js`, `src/modules/module-graph.js`, and generated dependency-plan output.
- [x] Add package self-reference tests for root entry, explicit subpath, pattern subpath, missing subpath, and condition-selected branches.
- [x] Add package `"exports"` pattern tests for deterministic `./features/*` resolution.
- [x] Add package `"imports"` pattern tests for deterministic `#internal/*` resolution.
- [x] Add focused diagnostics for unsupported package target arrays, invalid target types, and targets that leave allowed transpileable roots.
- [x] Add dependency-plan trace metadata showing which condition branch or pattern branch was selected.
- [x] Keep dynamic runtime module loading unsupported and aligned with `Jayess.md`.
- [x] Add output tests under `test/output/` for trace metadata shape and deterministic ordering.
- [x] Add module graph tests under `test/modules/` for successful and failing package resolution paths.
- [x] Update `docs/module-resolution.md` and generated project metadata docs.

## 240) Improve Async Cancellation Propagation

- [x] Inspect current cancellation behavior in `jayess:async`, `jayess:timers`, `jayess:net`, `jayess:http`, and `jayess:subprocess`.
- [x] Add cancellation-aware helper wrappers for supported net operations that already expose async handles.
- [x] Add cancellation-aware helper wrappers for supported HTTP request/server operations that already expose async handles.
- [x] Add cancellation-aware helper wrappers for supported subprocess operations that already expose async handles.
- [x] Add `withTimeout(handle, milliseconds)` or equivalent stdlib helper if it can compose directly with existing async timeout behavior.
- [x] Ensure cancelled operations settle through explicit Jayess async rejection values or documented cancellation values.
- [x] Add focused diagnostics for invalid cancellation tokens and invalid timeout values.
- [x] Add compile tests under `test/cpp/` for cancellation-aware net, HTTP, and subprocess helper imports.
- [x] Add output tests under `test/output/` for runtime feature inclusion.
- [x] Add generated-C++ runtime tests under `test/runtime/` for nested cancellation propagation and timeout propagation.
- [x] Update `docs/jayess-async-module.md`, `docs/jayess-net-module.md`, `docs/jayess-http-module.md`, and `docs/jayess-subprocess-module.md`.

## 241) Add Stream Pipeline Ergonomics

- [x] Inspect current `jayess:stream`, `jayess:fs`, `jayess:subprocess`, `jayess:http`, `jayess:bytes`, and `jayess:encoding` helper surfaces.
- [x] Add `pipeAll(streams, options)` or `pipeline(stages, options)` using deterministic left-to-right stream composition.
- [x] Add `collectBytes(stream, options)` with explicit max-size behavior.
- [x] Add `collectText(stream, options)` layered over bytes and encoding helpers.
- [x] Add subprocess stdout/stderr stream integration helpers if existing subprocess handles expose stream-compatible outputs.
- [x] Add HTTP body/static-file streaming tests where existing HTTP primitives expose stream-compatible bodies.
- [x] Keep reusable stream loops inside `jayess:stream` instead of duplicating loops in fs, HTTP, or subprocess modules.
- [x] Add focused diagnostics for invalid pipeline stages, invalid stream directions, closed streams, and max-size overflow.
- [x] Add compile tests under `test/cpp/` for pipeline and collect helpers.
- [x] Add output tests under `test/output/` for runtime feature inclusion and dependency metadata.
- [x] Add generated-C++ runtime tests under `test/runtime/` using files under `temp/` or test-managed temp directories.
- [x] Update `docs/jayess-stream-module.md` and related module docs.

## 242) Expand Generator And Class Runtime Coverage

- [x] Inspect current generator/class runtime fixtures under `test/fixtures/runtime/` and executable tests under `test/runtime/`.
- [x] Add generated-C++ runtime tests for generator `try/catch` paths where the try body throws before a supported yield.
- [x] Add generated-C++ runtime tests for focused catch-body yield behavior after an exception.
- [x] Add generated-C++ runtime tests for generator `try/finally` completion paths after multiple direct yields.
- [x] Add generated-C++ runtime tests for computed static `super[expr]` reads across deeper inheritance chains.
- [x] Add generated-C++ runtime tests for computed static `super[expr](...)` calls across deeper inheritance chains.
- [x] Add generated-C++ runtime tests for private static access boundaries between base and derived classes.
- [x] Add compile tests under `test/cpp/` for any newly covered supported class or generator shapes.
- [x] Preserve async generator rejection aligned with `Jayess.md`.
- [x] Update `docs/generator-lowering.md`, `docs/semantics.md`, `docs/limitations.md`, and `docs/feature-matrix.md` with any newly verified supported shapes.

## 243) Harden Lifetime And Escape Analysis Coverage

- [x] Inspect current lifetime analysis in `src/lifetime/analyze-escapes.js` and current lifetime tests under `test/lifetime/`.
- [x] Add tests for closure captures of block-scoped `var` bindings that escape their defining scope.
- [x] Add tests for async callbacks capturing locals that must remain valid after scope exit.
- [x] Add tests for generator state capturing locals across resume points.
- [x] Add tests for class methods and field initializers capturing or storing local values.
- [x] Add tests for module exports that expose values created inside initializer scopes.
- [x] Add generated-C++ runtime tests for representative escaping closure, async, generator, and class cases.
- [x] Keep lifetime fixes in the lifetime analysis and focused C++ ownership/lifetime helpers, not broad runtime keepalive workarounds.
- [x] Update `docs/lifetime-model.md` with the verified escape and promotion examples.

## 244) Split Dense Runtime And Emission Files Opportunistically

- [x] Inspect `src/cpp/runtime-async-source.js` and identify one scheduler, cancellation, or composition responsibility to extract.
- [x] Extract one async runtime responsibility into a focused file while preserving generated runtime output.
- [x] Inspect `src/cpp/runtime-http-source.js` and identify one client, server, or response-helper responsibility to extract.
- [x] Extract one HTTP runtime responsibility into a focused file while preserving generated runtime output.
- [x] Inspect `src/cpp/runtime-net-source.js` and identify one socket, server, or platform helper responsibility to extract.
- [x] Extract one net runtime responsibility into a focused file while preserving generated runtime output.
- [x] Inspect `src/cpp/emit-module.js` and identify one remaining expression or statement dispatch responsibility to extract.
- [x] Extract one emitter responsibility only after focused tests prove generated output remains stable.
- [x] Inspect `src/semantic/analyze.js` and identify one remaining statement semantic responsibility to extract.
- [x] Extract one semantic responsibility only after focused diagnostics tests prove behavior remains stable.
- [x] Run relevant runtime-source, output, compile, and semantic tests after each extraction.
- [x] Update `docs/cpp-emitter-organization.md` or focused organization docs when responsibilities move.

## 245) Add `jayess:test` Standard Library

- [x] Inspect existing `jayess:assert`, `jayess:async`, `jayess:console`, `jayess:json`, and executable runtime test helpers for reusable behavior.
- [x] Add `stdlib/jayess/test/index.js` as a Jayess-written module layered over existing stdlib modules where practical.
- [x] Define a compact test case object shape with `name`, `fn`, `passed`, `failed`, `error`, and `durationMillis` fields where relevant.
- [x] Add `test(name, fn)` to create deterministic Jayess test case objects.
- [x] Add `run(tests)` to execute an array of test cases and return a structured summary.
- [x] Add async-aware execution in `run(tests)` so Jayess async handles can be awaited through existing `jayess:async` helpers.
- [x] Add `assertEqual(actual, expected)`, `assertNotEqual(actual, expected)`, `assertOk(value)`, and `assertThrows(fn)` helpers if they can layer over `jayess:assert`.
- [x] Add focused diagnostics for invalid test names, invalid test functions, invalid test arrays, and failed assertions.
- [x] Register `jayess:test` through existing builtin module resolution.
- [x] Add module graph tests under `test/modules/` for `jayess:test` imports and dependency metadata.
- [x] Add output tests under `test/output/` for generated stdlib inclusion and runtime feature requirements.
- [x] Add compile tests under `test/cpp/` for synchronous and async test helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` for passing tests, failing assertions, thrown errors, and async test cases.
- [x] Add `docs/jayess-test-module.md` with exported helpers, result shape, async behavior, and assertion behavior.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 246) Deepen `jayess:http` Routing Helpers

- [x] Inspect current `jayess:http`, `jayess:url`, `jayess:querystring`, `jayess:mime`, `jayess:fs`, `jayess:bytes`, and `jayess:json` helper surfaces.
- [x] Add a Jayess-written route descriptor helper such as `route(method, path, handler)`.
- [x] Add `router(routes)` to create a deterministic route table from route descriptors.
- [x] Add `match(router, request)` or equivalent routing helper using existing request method/path helpers.
- [x] Add request helper exports for `header(request, name)`, `query(request)`, `textBody(request)`, `bytesBody(request)`, and `jsonBody(request)` where not already present.
- [x] Add response helper exports for `status(response, code)`, `sendText(response, text)`, `sendJson(response, value)`, `sendBytes(response, bytes)`, `redirect(response, location)`, and `notFound(response)`.
- [x] Add focused diagnostics for invalid route methods, invalid route paths, invalid handlers, invalid route arrays, and invalid response status codes.
- [x] Keep high-level routing logic in `stdlib/jayess/http/index.js` unless a narrow C++ primitive is required.
- [x] Add output tests under `test/output/` for dependency metadata and runtime feature inclusion.
- [x] Add compile tests under `test/cpp/` for route, router, request helper, and response helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` for route matching, JSON responses, redirects, not-found responses, and request body helpers.
- [x] Update `docs/jayess-http-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 247) Add Filesystem Temp And JSON Convenience Helpers

- [x] Inspect current `jayess:fs`, `jayess:path`, `jayess:json`, `jayess:os`, `jayess:uuid`, and `jayess:bytes` helper surfaces.
- [x] Add async `tempDirectory(prefix)` and sync `tempDirectorySync(prefix)` helpers using existing portable path and filesystem primitives.
- [x] Add async `tempFile(prefix, suffix)` and sync `tempFileSync(prefix, suffix)` helpers using existing portable path and filesystem primitives.
- [x] Add async `readJson(path)` and sync `readJsonSync(path)` helpers layered over text reads and `jayess:json`.
- [x] Add async `writeJson(path, value)` and sync `writeJsonSync(path, value)` helpers layered over JSON stringify and text writes.
- [x] Add focused diagnostics for invalid temp prefixes, invalid suffixes, invalid JSON paths, parse failures, and write failures.
- [x] Keep temp naming deterministic enough for tests while avoiding collisions through existing UUID or time helpers.
- [x] Add output tests under `test/output/` for dependency metadata and runtime feature inclusion.
- [x] Add compile tests under `test/cpp/` for async and sync helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` using test-managed directories under `temp/`.
- [x] Update `docs/jayess-fs-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 248) Improve Package Resolution Failure Traces

- [x] Inspect package resolution diagnostics in `src/modules/resolve-package-import.js`, `src/modules/module-graph.js`, and generated dependency-plan output.
- [x] Add trace metadata for attempted package root, requested subpath, selected condition branch, rejected condition branches, and allowed transpileable extensions.
- [x] Add trace metadata for failed package `"exports"` pattern matches.
- [x] Add trace metadata for failed package `"imports"` pattern matches.
- [x] Preserve deterministic trace ordering for successful and failed resolution paths.
- [x] Keep dynamic import and runtime source-module loading rejected according to `Jayess.md`.
- [x] Add module graph tests under `test/modules/` for failed root entry, missing subpath, unsupported target type, unsupported target array, outside-root target, and condition mismatch cases.
- [x] Add output tests under `test/output/` for dependency-plan failure trace shape if dependency-plan output records failed branches.
- [x] Update `docs/module-resolution.md` and generated project metadata docs.

## 249) Convert Remaining Generator Emission Errors To Semantic Diagnostics

- [x] Inspect remaining generator lowering errors in `src/cpp/emit-generator-expression.js`, `src/cpp/emit-generator-statement.js`, and semantic generator validators.
- [x] Add semantic diagnostics for generator statement shapes that currently reach generic emission-time errors.
- [x] Add semantic diagnostics for generator expression-yield positions that currently reach generic emission-time errors.
- [x] Add focused support for `yield` inside conditional expression branches where both branches can be lowered deterministically.
- [x] Add focused support for nested generator control-flow shapes that reuse existing direct-yield lowering helpers.
- [x] Preserve async generator rejection aligned with `Jayess.md`.
- [x] Add semantic tests under `test/semantic/` for each newly diagnosed unsupported generator shape.
- [x] Add compile tests under `test/cpp/` for each newly supported generator shape.
- [x] Add generated-C++ runtime tests under `test/runtime/` for nested generator resume behavior.
- [x] Update `docs/generator-lowering.md`, `docs/limitations.md`, and `docs/feature-matrix.md`.

## 250) Polish Remaining Class And `super` Diagnostics

- [x] Inspect class diagnostics in `src/semantic/classes.js`, `src/semantic/expressions.js`, `src/cpp/emit-class.js`, and class runtime tests.
- [x] Add focused diagnostics for invalid `super` reads outside supported derived class contexts.
- [x] Add focused diagnostics for invalid `super(...)` calls outside derived constructors.
- [x] Add focused diagnostics for invalid `super` property assignment forms.
- [x] Add focused diagnostics for invalid private/static access combinations across base and derived classes.
- [x] Extend computed `super[expr]` read/call support where it reuses existing class lowering and runtime helpers.
- [x] Add semantic tests under `test/semantic/` for each class diagnostic family.
- [x] Add compile tests under `test/cpp/` for each newly supported computed `super` form.
- [x] Add generated-C++ runtime tests under `test/runtime/` for static/private interactions across inheritance chains.
- [x] Update `docs/semantics.md`, `docs/limitations.md`, and `docs/feature-matrix.md`.

## 251) Normalize Remaining Runtime Error Families

- [x] Inspect remaining runtime messages in `src/cpp/runtime-source.js`, `src/cpp/runtime-core-value-source.js`, `src/cpp/runtime-core-composite-source.js`, `src/cpp/runtime-array-source.js`, `src/cpp/runtime-string-source.js`, `src/cpp/runtime-http-source.js`, `src/cpp/runtime-net-source.js`, and `src/cpp/runtime-subprocess-source.js`.
- [x] Catalog current unsupported receiver, unsupported operand, invalid option, string conversion, spread, destructuring, and JSON stringify runtime errors in a temporary note under `temp/`.
- [x] Add or reuse narrow runtime validation helpers only where multiple runtime files share the same validation rule.
- [x] Normalize unsupported receiver diagnostics for array, string, object, map, set, stream, net, HTTP, and subprocess helpers.
- [x] Normalize invalid option diagnostics for net, HTTP, and subprocess option objects.
- [x] Normalize unsupported string conversion and template interpolation diagnostics.
- [x] Normalize spread and destructuring source diagnostics.
- [x] Add focused runtime-source tests under `test/` for each normalized runtime error family.
- [x] Add generated-C++ runtime tests under `test/runtime/` for representative user-visible errors.
- [x] Update `docs/diagnostics.md` with normalized runtime error families.

## 252) Add Workflow Runtime Verification Fixtures

- [x] Inspect existing generated executable helpers under `test/support/` and runtime fixtures under `test/fixtures/runtime/`.
- [x] Add a CLI-style runtime fixture that parses args, loads config, and writes output using Jayess stdlib modules.
- [x] Add an HTTP-style runtime fixture that serves JSON and a static file through `jayess:http` helpers.
- [x] Add a subprocess pipeline runtime fixture that transforms text through `jayess:subprocess` and `jayess:stream`.
- [x] Add an fs/glob/hash runtime fixture that scans a test directory and hashes matching files.
- [x] Add an async cancellation runtime fixture that crosses HTTP, net, or subprocess helpers where current primitives support it.
- [x] Keep generated runtime projects under `temp/` or test-managed temporary directories.
- [x] Keep each runtime test file focused by workflow family under `test/runtime/`.
- [x] Update `docs/runtime-verification.md` with the new workflow coverage.

## 253) Add `jayess:color` Standard Library

- [x] Inspect `docs/jayess-color-module.md`, `docs/jayess-native-gui.md`, existing pure Jayess stdlib modules, and builtin module registration patterns.
- [x] Add `stdlib/jayess/color/index.js` as a small Jayess-written module.
- [x] Define the color value object shape with `red`, `green`, `blue`, and `alpha` fields.
- [x] Add `rgb(red, green, blue)` with byte-range validation and default alpha `1`.
- [x] Add `rgba(red, green, blue, alpha)` with byte-range validation and alpha validation.
- [x] Add `parse(text)` for focused `#rgb`, `#rrggbb`, `rgb(...)`, and `rgba(...)` inputs.
- [x] Add `toHex(color)` for deterministic lowercase `#rrggbb` output.
- [x] Add `withAlpha(color, alpha)` without mutating the original color object.
- [x] Add `mix(left, right, amount)` with clamped interpolation.
- [x] Add `lighten(color, amount)` and `darken(color, amount)` layered over `mix`.
- [x] Add focused diagnostics for invalid channels, invalid alpha values, invalid parse input, and invalid mix amounts.
- [x] Register `jayess:color` through existing builtin module resolution.
- [x] Add module graph tests under `test/modules/` for `jayess:color` imports.
- [x] Add output tests under `test/output/` for generated stdlib inclusion and dependency metadata.
- [x] Add compile tests under `test/cpp/` for `jayess:color` helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` for construction, parsing, conversion, and blending.
- [x] Update `docs/jayess-color-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 254) Add `jayess:image` Software Raster Buffer

- [x] Inspect `jayess:bytes`, `jayess:fs`, `jayess:color`, runtime fragment registration, native bridge header patterns, and generated runtime feature detection.
- [x] Add `stdlib/jayess/image/index.js` as a Jayess-owned wrapper over focused image primitives.
- [x] Add `stdlib/jayess/image/image-primitives.hpp` with a narrow native bridge.
- [x] Add focused runtime source files for image handle storage and image operations.
- [x] Register an `image` runtime fragment without adding image logic to unrelated large runtime files.
- [x] Define image handle storage with width, height, and RGBA pixel data.
- [x] Add `create(width, height, background)` with dimension and color validation.
- [x] Add `width(image)` and `height(image)`.
- [x] Add `getPixel(image, x, y)` returning a `jayess:color`-compatible object.
- [x] Add `setPixel(image, x, y, color)` with bounds validation.
- [x] Add `fill(image, color)` for whole-buffer fill.
- [x] Add `copy(image)` as a deep pixel-buffer copy.
- [x] Add `savePpm(image, path)` as the first dependency-free image output format.
- [x] Keep BMP, PNG, JPEG, and live windows out of this slice.
- [x] Add output tests under `test/output/` for runtime fragment inclusion and generated native bridge files.
- [x] Add compile tests under `test/cpp/` for image helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` that create images, mutate pixels, and verify saved PPM content under `temp/`.
- [x] Update `docs/jayess-image-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 255) Add First `jayess:canvas` Drawing Slice

- [x] Inspect `jayess:image`, `jayess:color`, planned canvas docs, and runtime/image primitive boundaries.
- [x] Add `stdlib/jayess/canvas/index.js` as a Jayess-owned drawing module over `jayess:image`.
- [x] Add any needed `canvas-primitives.hpp` bridge only for drawing operations that should stay native for correctness or performance.
- [x] Add focused runtime source files for canvas drawing without merging drawing logic into `runtime-image-source.js`.
- [x] Define the first canvas object shape as a wrapper around an image buffer plus optional metadata.
- [x] Add `create(width, height, options)` with optional `background` and `title` fields.
- [x] Add `clear(canvas, color)`.
- [x] Add `fillRect(canvas, x, y, width, height, color)` with clipping.
- [x] Add `strokeRect(canvas, x, y, width, height, color)` with clipping.
- [x] Add `line(canvas, x1, y1, x2, y2, color)` with deterministic rasterization.
- [x] Add `savePpm(canvas, path)` instead of broad `saveImage` for the first format-specific slice.
- [x] Keep text rendering, circles, paths, and live window presentation out of this first canvas slice.
- [x] Add output tests under `test/output/` for canvas stdlib inclusion and image/color dependencies.
- [x] Add compile tests under `test/cpp/` for canvas helper imports.
- [x] Add generated-C++ runtime tests under `test/runtime/` that render a small scene to PPM under `temp/`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-native-gui.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 256) Improve `jayess:http` Server Lifecycle

- [x] Inspect `stdlib/jayess/http/index.js`, `src/cpp/runtime-http-source.js`, HTTP runtime tests, and workflow runtime fixtures.
- [x] Split any large HTTP runtime helper responsibilities before adding lifecycle logic if the target file would become hard to review.
- [x] Add multi-request server accept behavior while preserving the existing request/response handler surface.
- [x] Add `close(server)` to the Jayess module and native bridge if it is not already exposed.
- [x] Add server closed-handle diagnostics aligned with existing normalized handle diagnostics.
- [x] Update `route`, `match`, and `handle` so route matching compares pathnames without query strings.
- [x] Add route parameter support for patterns such as `/users/:id`.
- [x] Add a request helper for route params when a matched route provides them.
- [x] Add compact middleware helpers only if they stay Jayess-written and reviewable, such as `compose(handlers)`.
- [x] Add runtime tests under `test/runtime/` for multiple requests served by one server.
- [x] Add runtime tests for `close(server)` and post-close diagnostics.
- [x] Add tests for query-agnostic route matching and route params.
- [x] Update `docs/jayess-http-module.md`, `docs/runtime-verification.md`, and `docs/standard-library.md`.

## 257) Add Static Directory Helpers For `jayess:http`

- [x] Inspect existing `sendFile`, `jayess:fs`, `jayess:path`, `jayess:mime`, and route helper surfaces.
- [x] Add `serveStatic(root, options)` as a Jayess-written HTTP helper.
- [x] Normalize requested paths before filesystem access.
- [x] Reject or sanitize `..` traversal so requests cannot escape the static root.
- [x] Add optional index file support through `options.index`.
- [x] Use `jayess:mime` for content type lookup.
- [x] Return `notFound` for missing paths.
- [x] Add focused diagnostics for invalid roots, invalid options, and unsafe paths.
- [x] Add output tests under `test/output/` for stdlib dependency metadata.
- [x] Add generated-C++ runtime tests under `test/runtime/` using a test-managed static directory under `temp/`.
- [x] Update `docs/jayess-http-module.md`, `docs/standard-library.md`, and `docs/runtime-verification.md`.

## 258) Deepen `jayess:net` Portability Boundaries

- [x] Inspect `src/cpp/runtime-net-source.js`, net state/runtime helper files, `jayess:net` docs, and net runtime tests.
- [x] Split POSIX socket helpers into a focused runtime file if they are still mixed with platform-independent net logic.
- [x] Add a guarded Windows adapter source shape for socket setup, cleanup, connect, listen, read, write, and close.
- [x] Keep Windows support behind compile-time guards and clear runtime diagnostics until each operation is implemented.
- [x] Normalize platform-unavailable diagnostics for net operations.
- [x] Ensure generated runtime metadata records net runtime feature requirements.
- [x] Add source-level tests under `test/output/` for platform guard emission.
- [x] Add runtime tests that skip unsupported host adapters cleanly.
- [x] Update `docs/jayess-net-module.md`, `docs/limitations.md`, and `docs/runtime-verification.md`.

## 259) Convert Remaining Reachable Emitter Errors To Diagnostics

- [x] Inspect reachable thrown errors in `src/cpp/emit-generator-expression.js`, `src/cpp/emit-generator-statement.js`, `src/cpp/emit-class.js`, and `src/cpp/emit-operators.js`.
- [x] Catalog remaining emission-time unsupported-shape errors in a temporary note under `temp/`.
- [x] Add semantic diagnostics for reachable unsupported generator expression-yield forms.
- [x] Add semantic diagnostics for reachable unsupported generator statement-yield forms.
- [x] Add semantic diagnostics for reachable unsupported class and constructor lowering shapes.
- [x] Add semantic diagnostics for reachable unsupported unary/operator lowering shapes.
- [x] Keep unreachable internal assertion errors as internal errors only when tests prove they cannot be reached from valid parsed source.
- [x] Add semantic tests under `test/semantic/` for each newly diagnosed user-visible shape.
- [x] Add API tests under `test/api/` proving diagnostics are returned before C++ emission.
- [x] Update `docs/diagnostics.md`, `docs/limitations.md`, and `docs/feature-matrix.md`.

## 260) Harden Package `exports` Array Resolution

- [x] Inspect `src/modules/resolve-package-import.js`, `src/modules/module-graph.js`, and package fixture tests.
- [x] Add support for package `exports` arrays whose entries are supported string targets or supported condition objects.
- [x] Preserve deterministic first-success resolution through exports arrays.
- [x] Add trace metadata for skipped unsupported array entries.
- [x] Add diagnostics for arrays that contain no supported transpileable target.
- [x] Keep dynamic import and runtime module loading unsupported according to `Jayess.md`.
- [x] Add package fixtures under `test/fixtures/package-project/` for successful and failed exports arrays.
- [x] Add module graph tests under `test/modules/`.
- [x] Add dependency-plan output tests under `test/output/`.
- [x] Update `docs/module-resolution.md` and generated project metadata docs.

## 261) Add `jayess:html` Text Helper Module

- [x] Inspect `jayess:string`, `jayess:array`, `jayess:object`, HTTP/webview docs, and existing pure Jayess stdlib module patterns.
- [x] Add `stdlib/jayess/html/index.js` as a Jayess-written helper module.
- [x] Add `escapeText(value)` for text-node escaping.
- [x] Add `escapeAttribute(value)` for attribute escaping.
- [x] Add `tag(name, attributes, children)` for deterministic HTML string construction.
- [x] Add `fragment(children)` for concatenating child strings.
- [x] Add focused diagnostics for invalid tag names, invalid attribute names, and invalid child values.
- [x] Register `jayess:html` through existing builtin module resolution.
- [x] Add module graph, output, compile, and generated-C++ runtime tests.
- [x] Add `docs/jayess-html-module.md`.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 262) Add Focused Markup And Data Standard Libraries

- [x] Add `jayess:xml` parse/stringify helpers for a narrow XML subset with explicit diagnostics.
- [x] Add `jayess:yaml` config-oriented parse/stringify helpers for a narrow YAML subset.
- [x] Add `jayess:markdown` tokenizer or small markdown-to-HTML helper for headings, paragraphs, code fences, links, and lists.
- [x] Keep each module in its own `stdlib/jayess/<module>/index.js` file.
- [x] Keep each module's tests in focused files under `test/modules/`, `test/output/`, `test/cpp/`, and `test/runtime/`.
- [x] Add docs for each module under `docs/`.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 263) Add Cross-platform `jayess:window` Native Presentation Slice

- [x] Inspect `Agents.md`, `Jayess.md`, `docs/jayess-native-gui.md`, `docs/jayess-canvas-module.md`, `stdlib/jayess/canvas/index.js`, `stdlib/jayess/image/index.js`, and existing runtime handle patterns.
- [x] Add `docs/jayess-window-module.md` with the first window API, event shape, backend boundary, and platform-unavailable diagnostics.
- [x] Add `stdlib/jayess/window/index.js` as a focused Jayess-owned wrapper module.
- [x] Add a narrow native bridge header under `stdlib/jayess/window/`.
- [x] Add `src/cpp/runtime-window-source.js` for platform-neutral window handle validation, exported primitive declarations, and normalized diagnostics.
- [x] Add focused platform adapter source files instead of one large window runtime file.
- [x] Add a Windows adapter skeleton for create/show/close/poll/present using compile-time guards.
- [x] Add a macOS adapter skeleton for create/show/close/poll/present using compile-time guards.
- [x] Add a Linux adapter skeleton for create/show/close/poll/present using compile-time guards.
- [x] Add `create(options)` with `title`, `width`, and `height` options.
- [x] Add `show(window)` and `close(window)` helpers.
- [x] Add `pollEvents(window)` returning an array of stable event objects.
- [x] Add `present(window, canvas)` to present the current `jayess:canvas` software buffer.
- [x] Add `width(window)`, `height(window)`, and `setTitle(window, title)`.
- [x] Normalize unsupported-platform diagnostics for each window operation.
- [x] Ensure generated metadata records the selected window runtime feature and platform adapter requirement.
- [x] Add module graph tests under `test/modules/` for `jayess:window`.
- [x] Add output tests under `test/output/` for generated stdlib inclusion, runtime feature metadata, and platform adapter files.
- [x] Add compile tests under `test/cpp/` that compile the generated window surface on the host platform or verify guarded unavailable adapters compile.
- [x] Add runtime tests under `test/runtime/` for platform-unavailable diagnostics and host-supported presentation behavior when available.
- [x] Update `docs/jayess-native-gui.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 264) Deepen `jayess:canvas` For Window Presentation

- [x] Inspect current `jayess:canvas`, `jayess:image`, `jayess:color`, and image runtime boundaries before adding drawing helpers.
- [x] Add `width(canvas)` and `height(canvas)` helpers.
- [x] Add `getPixel(canvas, x, y)` using the underlying `jayess:image` buffer.
- [x] Add `copy(canvas)` as a deep copy of canvas image data and metadata.
- [x] Add `drawImage(canvas, image, x, y)` with clipping.
- [x] Add `drawCanvas(target, source, x, y)` with clipping.
- [x] Add `fillCircle(canvas, centerX, centerY, radius, color)` with deterministic rasterization.
- [x] Add `strokeCircle(canvas, centerX, centerY, radius, color)` with deterministic rasterization.
- [x] Add `polyline(canvas, points, color)` by reusing existing line drawing.
- [x] Keep live window behavior out of `jayess:canvas`; presentation remains in `jayess:window`.
- [x] Add focused diagnostics for invalid canvases, images, points arrays, and numeric drawing arguments.
- [x] Add module graph tests under `test/modules/` for new canvas helper imports.
- [x] Add output tests under `test/output/` for generated stdlib dependency metadata.
- [x] Add compile tests under `test/cpp/` for generated projects using the new canvas helpers.
- [x] Add generated-C++ runtime tests under `test/runtime/` that verify pixels and saved image output under `temp/`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 265) Deepen `jayess:image` File And Blit Helpers

- [x] Inspect `jayess:image`, `runtime-image-source.js`, image primitive headers, and canvas tests before adding image helpers.
- [x] Add `saveBmp(image, path)` as a dependency-free image output format that common image viewers can open.
- [x] Add `loadPpm(path)` for deterministic round-trip tests and simple asset loading.
- [x] Add `crop(image, x, y, width, height)` returning a new image.
- [x] Add `resizeNearest(image, width, height)` returning a new image.
- [x] Add `blit(target, source, x, y)` with clipping.
- [x] Add focused diagnostics for invalid dimensions, paths, image handles, and unsupported PPM content.
- [x] Keep PNG/JPEG encoding out of this slice unless a later explicit dependency policy is added.
- [x] Add output tests under `test/output/` for runtime fragment inclusion and generated native bridge files.
- [x] Add compile tests under `test/cpp/` for image file and blit helpers.
- [x] Add generated-C++ runtime tests under `test/runtime/` that write BMP, load PPM, crop, resize, and blit images under `temp/`.
- [x] Update `docs/jayess-image-module.md`, `docs/jayess-canvas-module.md`, and `docs/standard-library.md`.

## 266) Add Stable Cross-platform Window Event Model

- [x] Inspect `jayess:window` surface, host adapter boundaries, and runtime value conversion helpers.
- [x] Define stable event object shapes for `close`, `resize`, `keyDown`, `keyUp`, `mouseMove`, `mouseDown`, and `mouseUp`.
- [x] Add key normalization for letters, digits, arrows, escape, enter, tab, space, shift, control, alt, and meta.
- [x] Add mouse button normalization for left, middle, right, and unknown buttons.
- [x] Add event queue storage to the window handle runtime state.
- [x] Add adapter hooks that push normalized events into the queue.
- [x] Ensure `pollEvents(window)` drains events deterministically.
- [x] Add focused diagnostics for invalid or closed window handles.
- [x] Add output tests under `test/output/` for event runtime metadata.
- [x] Add compile tests under `test/cpp/` for generated event polling code.
- [x] Add runtime tests under `test/runtime/` for queue behavior and platform-unavailable diagnostics.
- [x] Update `docs/jayess-window-module.md` and `docs/jayess-native-gui.md`.

## 267) Add `jayess:gpu` API And Backend Boundary

- [x] Inspect `Agents.md`, `docs/jayess-native-gui.md`, generated runtime feature metadata, native artifact handling, and window adapter layout.
- [x] Add `docs/jayess-gpu-module.md` with the first GPU API, backend model, and platform/backend diagnostics.
- [x] Add `stdlib/jayess/gpu/index.js` as a focused Jayess-owned wrapper module.
- [x] Add a narrow native bridge header under `stdlib/jayess/gpu/`.
- [x] Add `src/cpp/runtime-gpu-source.js` for backend-neutral GPU handle validation, exported primitive declarations, and normalized diagnostics.
- [x] Add isolated backend adapter source files for Direct3D, Metal, Vulkan, and OpenGL compile-time boundaries.
- [x] Add `createDevice(options)` with explicit backend selection or host-default backend selection.
- [x] Add `createSurface(window)` to connect GPU presentation to `jayess:window`.
- [x] Add `createBuffer(device, options)` and `createTexture(device, options)` handle constructors.
- [x] Add `createShader(device, source)` with explicit shader source diagnostics.
- [x] Add `createPipeline(device, options)` with a narrow first pipeline object shape.
- [x] Add `beginFrame(surface)`, `draw(frame, pipeline, resources)`, and `endFrame(frame)`.
- [x] Add a first accelerated clear-color frame path before triangle or mesh drawing.
- [x] Normalize backend-unavailable diagnostics for each GPU operation.
- [x] Ensure generated metadata records selected GPU backend requirements and platform adapter files.
- [x] Keep `jayess:canvas` independent from `jayess:gpu`; GPU acceleration remains optional.
- [x] Add module graph tests under `test/modules/` for `jayess:gpu`.
- [x] Add output tests under `test/output/` for generated stdlib inclusion, backend metadata, and guarded adapter files.
- [x] Add compile tests under `test/cpp/` that compile backend-neutral generated output and guarded adapter boundaries.
- [x] Add runtime tests under `test/runtime/` for backend-unavailable diagnostics and host-supported clear-frame behavior when available.
- [x] Update `docs/jayess-native-gui.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 268) Add GUI Utility Standard Libraries

- [x] Add `jayess:layout` rectangle and box layout helpers for GUI and canvas code.
- [x] Add `rect(x, y, width, height)`, `contains(rect, x, y)`, `intersect(a, b)`, and `inset(rect, amount)`.
- [x] Add row, column, and grid layout helpers that return deterministic rectangle arrays.
- [x] Add `jayess:font` bitmap-font text measurement and drawing helpers over `jayess:canvas`.
- [x] Add a small built-in bitmap font data module or deterministic generated glyph table under `stdlib/jayess/font/`.
- [x] Add `measureText(font, text)` and `drawText(canvas, font, text, x, y, color)`.
- [x] Add `jayess:clipboard` as a platform-adapter-backed module after `jayess:window` exists.
- [x] Add focused diagnostics for invalid rectangles, layout options, fonts, text, and platform-unavailable clipboard operations.
- [x] Keep each module in its own `stdlib/jayess/<module>/index.js` file.
- [x] Keep runtime/platform adapters split by module and operating system.
- [x] Add focused tests under `test/modules/`, `test/output/`, `test/cpp/`, and `test/runtime/`.
- [x] Add docs under `docs/` for each new module.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 269) Add First Real `jayess:window` Host Adapter Slice

- [x] Inspect `stdlib/jayess/window/index.js`, `stdlib/jayess/window/window-primitives.hpp`, `src/cpp/runtime-window-source.js`, and existing platform adapter files.
- [x] Pick the host adapter matching the current development platform and keep all host API code inside that adapter file.
- [x] Implement adapter-backed window handle state without changing the public `jayess:window` import surface.
- [x] Implement `create(options)` host window creation for `title`, `width`, and `height`.
- [x] Implement `show(window)` for the selected host adapter.
- [x] Implement `close(window)` host resource cleanup for the selected host adapter.
- [x] Implement `setTitle(window, title)` for the selected host adapter.
- [x] Implement `present(window, canvas)` for presenting the current `jayess:canvas` software image buffer.
- [x] Preserve normalized unavailable diagnostics on unsupported host platforms.
- [x] Keep non-selected platform adapters compiling with guarded unavailable behavior.
- [x] Add output tests under `test/output/` for adapter metadata and guarded platform output.
- [x] Add compile tests under `test/cpp/` for generated projects importing `jayess:window`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that exercise host-supported behavior or assert the unavailable diagnostic.
- [x] Update `docs/jayess-window-module.md` and `docs/jayess-native-gui.md`.

## 270) Wire Host Window Events Into `jayess:window`

- [x] Inspect the window event queue helpers and selected host adapter event polling APIs.
- [x] Push `close` events into the existing window event queue.
- [x] Push `resize` events with normalized `width` and `height`.
- [x] Push `keyDown` and `keyUp` events through the existing key normalization helper.
- [x] Push `mouseMove` events with `x` and `y`.
- [x] Push `mouseDown` and `mouseUp` events through the existing button normalization helper.
- [x] Ensure `pollEvents(window)` drains queued host events deterministically.
- [x] Preserve closed-window diagnostics and unavailable-host diagnostics.
- [x] Add output tests under `test/output/` for event adapter code inclusion.
- [x] Add compile tests under `test/cpp/` for event polling projects.
- [x] Add generated-C++ runtime tests under `test/runtime/` for queue draining and host-unavailable fallback.
- [x] Update `docs/jayess-window-module.md`.

## 271) Deepen `jayess:font` Bitmap Text Rendering

- [x] Inspect `stdlib/jayess/font/`, `stdlib/jayess/canvas/`, and existing GUI utility tests.
- [x] Add a focused printable-ASCII bitmap glyph table under `stdlib/jayess/font/`.
- [x] Keep glyph data in a separate small file from public font helpers.
- [x] Add `lineHeight(font)`.
- [x] Add `charWidth(font, char)`.
- [x] Add multi-line `measureText(font, text)` support.
- [x] Add multi-line `drawText(canvas, font, text, x, y, color)` support.
- [x] Preserve the existing null-font default behavior.
- [x] Add focused diagnostics for invalid font objects and unsupported glyph input.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that verify rendered pixels in an image under `temp/`.
- [x] Update `docs/jayess-font-module.md` and `docs/standard-library.md`.

## 272) Deepen `jayess:image` With BMP Loading And Alpha Blitting

- [x] Inspect `stdlib/jayess/image/`, `src/cpp/runtime-image-source.js`, and image runtime tests.
- [x] Add `loadBmp(path)` for uncompressed 24-bit BMP input.
- [x] Add focused diagnostics for unsupported BMP headers, dimensions, and bit depth.
- [x] Add `flipHorizontal(image)` returning a new image.
- [x] Add `flipVertical(image)` returning a new image.
- [x] Add `rotate90(image)` returning a new image.
- [x] Add `transparentBlit(target, source, x, y)` using source alpha.
- [x] Keep PNG/JPEG support out of this slice.
- [x] Add output tests under `test/output/` for new native bridge declarations.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that load BMP, transform images, and verify pixels under `temp/`.
- [x] Update `docs/jayess-image-module.md` and `docs/standard-library.md`.

## 273) Add GPU Clear Frame And Backend Metadata

- [x] Inspect `stdlib/jayess/gpu/`, `src/cpp/runtime-gpu-source.js`, runtime feature analysis, and generated dependency-plan output.
- [x] Add `clear(frame, color)` to the `jayess:gpu` public surface.
- [x] Add native bridge support for `clear(frame, color)`.
- [x] Validate color objects using the existing `jayess:color` shape.
- [x] Record selected GPU backend requirements in generated dependency-plan metadata.
- [x] Record selected GPU backend requirements in generated build hints where available.
- [x] Preserve backend-unavailable diagnostics for unimplemented adapters.
- [x] Keep `jayess:canvas` independent from `jayess:gpu`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for metadata and runtime fragments.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for `clear` diagnostics and host-unavailable fallback.
- [x] Update `docs/jayess-gpu-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 274) Add `jayess:watch` File Watcher Module

- [x] Inspect `jayess:fs`, `jayess:path`, runtime handle patterns, and platform adapter organization.
- [x] Add `docs/jayess-watch-module.md`.
- [x] Add `stdlib/jayess/watch/index.js` with a focused public wrapper surface.
- [x] Add a narrow native bridge header under `stdlib/jayess/watch/`.
- [x] Add platform-neutral runtime handle validation and normalized diagnostics in a focused runtime file.
- [x] Add platform adapter files split by operating system.
- [x] Add `watch(path, options)` returning a watcher handle.
- [x] Add `poll(watcher)` returning deterministic file event objects.
- [x] Add `close(watcher)`.
- [x] Normalize event types as `create`, `modify`, `remove`, and `unknown`.
- [x] Preserve host-unavailable diagnostics on unsupported platforms.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that use `temp/` fixtures or assert unavailable diagnostics.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 275) Add `jayess:terminal` CLI Display Helpers

- [x] Inspect `jayess:console`, `jayess:process`, and existing CLI helper modules.
- [x] Add `docs/jayess-terminal-module.md`.
- [x] Add `stdlib/jayess/terminal/index.js`.
- [x] Add `ansi(style)` helpers for focused color and emphasis escape sequences.
- [x] Add `stripAnsi(text)`.
- [x] Add `cursorTo(row, column)`, `clearScreen()`, and `clearLine()`.
- [x] Add `size()` through a focused native primitive with unavailable fallback.
- [x] Add diagnostics for invalid style names and invalid cursor coordinates.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for pure string helpers and size fallback.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 276) Add Package Resolution Trace Hardening

- [x] Inspect `src/modules/resolve-package-import.js`, `src/modules/module-graph.js`, and existing package fixture tests.
- [x] Add dependency-plan trace entries for selected package `exports` branches.
- [x] Add dependency-plan trace entries for selected package `imports` branches.
- [x] Add trace entries for rejected condition branches.
- [x] Add trace entries for package self-reference resolution.
- [x] Add tests for nested self-reference package layouts.
- [x] Add tests for mixed condition arrays with supported and unsupported entries.
- [x] Preserve dynamic `import()` as unsupported according to `Jayess.md`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add dependency-plan output tests under `test/output/`.
- [x] Update `docs/module-resolution.md` and `docs/generated-project-layout.md`.

## 277) Refactor Runtime HTTP Source By Responsibility

- [x] Inspect `src/cpp/runtime-http-source.js` and existing HTTP tests before editing.
- [x] Extract request object helpers into a focused runtime HTTP request source file.
- [x] Extract response object helpers into a focused runtime HTTP response source file when not already isolated enough.
- [x] Extract server lifecycle helpers into a focused runtime HTTP server source file when not already isolated enough.
- [x] Preserve generated runtime public declarations.
- [x] Preserve generated C++ behavior and diagnostics.
- [x] Avoid formatting unrelated runtime code.
- [x] Run focused HTTP output, compile, and runtime tests.
- [x] Run broader runtime fragment tests.
- [x] Update `docs/cpp-emitter-organization.md` if file organization changes.

## 278) Refactor Semantic Analyze Entry Point By Feature

- [x] Inspect `src/semantic/analyze.js` and existing semantic helper modules.
- [x] Identify one cohesive responsibility still living in the analyzer entry point.
- [x] Extract that responsibility into a focused semantic helper file.
- [x] Preserve existing semantic diagnostics and diagnostic ordering.
- [x] Avoid changing parser or emitter behavior in this slice.
- [x] Add or update focused semantic tests only if coverage is missing.
- [x] Run semantic tests under `test/semantic/`.
- [x] Run API transpile diagnostics tests.
- [x] Update `docs/semantic-organization.md` if module boundaries change.

## 279) Complete Cross-Platform `jayess:net` Windows Adapter

- [x] Inspect `stdlib/jayess/net/`, `src/cpp/runtime-net-source.js`, `src/cpp/runtime-net-platform-source.js`, and current POSIX net runtime tests.
- [x] Keep the public `jayess:net` import surface unchanged.
- [x] Add focused Windows socket adapter code behind compile-time platform guards.
- [x] Implement Windows TCP client connection creation for the existing connect helper surface.
- [x] Implement Windows TCP server listen/accept behavior for the existing server helper surface.
- [x] Implement Windows send and receive behavior using the same Jayess bytes/text conversion rules as the POSIX path.
- [x] Implement Windows close behavior for client and server handles.
- [x] Normalize Windows socket errors into the existing `jayess:net` diagnostic style.
- [x] Preserve POSIX behavior and generated output.
- [x] Keep platform-specific code isolated from platform-neutral net handle validation.
- [x] Add output tests under `test/output/` for Windows adapter inclusion and metadata.
- [x] Add compile tests under `test/cpp/` for guarded Windows adapter declarations and platform-neutral output.
- [x] Add generated-C++ runtime tests under `test/runtime/` for host-supported TCP client/server roundtrip or unavailable fallback.
- [x] Update `docs/jayess-net-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 280) Deepen `jayess:subprocess` Execution Controls

- [x] Inspect `stdlib/jayess/subprocess/`, `src/cpp/runtime-subprocess-source.js`, and subprocess tests.
- [x] Preserve the current `jayess:subprocess` public helpers and diagnostics.
- [x] Add optional `cwd` support for process execution options.
- [x] Add optional environment override support for process execution options.
- [x] Add optional stdin text input support.
- [x] Add optional stdin bytes input support using the `jayess:bytes` representation.
- [x] Add timeout support that terminates or reports timed-out subprocesses deterministically.
- [x] Add cancellation-token integration using the existing `jayess:async` cancellation model where async subprocess helpers exist.
- [x] Normalize stdout, stderr, exit code, timeout, and cancellation result object shapes.
- [x] Keep platform-specific process-launch code in focused helper functions inside the subprocess runtime file or a small extracted subprocess platform file.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for new primitive declarations and runtime metadata.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` using fixtures and temporary files under `temp/`.
- [x] Update `docs/jayess-subprocess-module.md` and `docs/standard-library.md`.

## 281) Add Runtime Executable Coverage For Host And IO Modules

- [x] Inspect `test/support/generated-executable.js`, existing `test/runtime/` helpers, and current module runtime tests.
- [x] Keep all runtime fixtures under `test/fixtures/` or generated temporary paths under `temp/`.
- [x] Add a `jayess:http` executable test that handles multiple requests through one server lifecycle.
- [x] Add a `jayess:net` executable test that performs a TCP client/server roundtrip on supported hosts.
- [x] Add a `jayess:subprocess` executable test that validates stdout, stderr, and exit code behavior.
- [x] Add a `jayess:fs` executable test that validates default async `readText`, `writeText`, and `remove` behavior.
- [x] Add a `jayess:canvas` plus `jayess:image` executable test that renders deterministic pixels and writes output under `temp/`.
- [x] Add a `jayess:async`, `jayess:thread`, `jayess:channel`, or `jayess:workqueue` executable test for one coordination workflow.
- [x] Use host-availability checks where platform adapters are intentionally guarded.
- [x] Keep each runtime test file small and grouped by module.
- [x] Avoid adding or editing GitHub workflow files.
- [x] Update `docs/runtime-verification.md` with the local runtime test pattern.

## 282) Refactor `runtime-async-source.js` By Responsibility

- [x] Inspect `src/cpp/runtime-async-source.js`, `src/cpp/runtime-async-scheduler-source.js`, async stdlib wrappers, and async runtime tests.
- [x] Extract async handle state helpers into a focused runtime source file.
- [x] Extract async combinator helpers such as all/race/any/allSettled into a focused runtime source file.
- [x] Extract cancellation-token helpers into a focused runtime source file.
- [x] Preserve generated public primitive declarations and helper names.
- [x] Preserve async handle lifecycle, completion state, and diagnostics.
- [x] Preserve scheduler-backed sleep and timeout behavior.
- [x] Avoid changing parser, semantic, or public API behavior in this refactor.
- [x] Add or update focused tests only where existing async coverage is missing.
- [x] Run async module output tests under `test/output/`.
- [x] Run async compile tests under `test/cpp/`.
- [x] Run async generated-C++ runtime tests under `test/runtime/`.
- [x] Update `docs/cpp-emitter-organization.md` if runtime source organization changes.

## 283) Deepen `jayess:stream` And HTTP Streaming Helpers

- [x] Inspect `stdlib/jayess/stream/`, `src/cpp/runtime-stream-source.js`, `stdlib/jayess/http/`, and HTTP runtime source files.
- [x] Add `toBytes(stream)` for deterministic stream consumption into `jayess:bytes`.
- [x] Add `toText(stream)` for deterministic stream consumption into a Jayess string.
- [x] Add `copy(source, target)` or `pipe(source, target)` using the existing stream handle model.
- [x] Add focused stream diagnostics for invalid stream handles and closed streams.
- [x] Add HTTP request body stream support where the current request object already owns body data.
- [x] Add HTTP response streaming helper for sending bytes or text stream content.
- [x] Preserve existing HTTP `text`, `bytes`, `json`, `sendText`, `sendBytes`, and `serveStatic` behavior.
- [x] Keep stream runtime changes separate from HTTP request and response source files.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for stream and HTTP runtime metadata.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for stream-to-text, stream-to-bytes, and one HTTP streaming case.
- [x] Update `docs/jayess-stream-module.md`, `docs/jayess-http-module.md`, and `docs/standard-library.md`.

## 284) Deepen `jayess:canvas` And `jayess:image` Drawing Utilities

- [x] Inspect `stdlib/jayess/canvas/`, `stdlib/jayess/image/`, `stdlib/jayess/color/`, and image/canvas runtime tests.
- [x] Add clipping rectangle helpers for canvas drawing operations.
- [x] Add text alignment helpers using the existing `jayess:font` bitmap rendering.
- [x] Add `fillPolygon(canvas, points, color)` with deterministic software rasterization.
- [x] Add `strokePolygon(canvas, points, color)` by reusing line/polyline behavior.
- [x] Add alpha-aware rectangle or image blending helpers using the existing color alpha shape.
- [x] Add image metadata helpers for file format and dimensions where data is already available.
- [x] Preserve CPU software rendering as the default canvas path.
- [x] Keep live window presentation inside `jayess:window`, not `jayess:canvas`.
- [x] Keep GPU acceleration separate under `jayess:gpu`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that verify deterministic pixels and output files under `temp/`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-image-module.md`, and `docs/jayess-native-gui.md`.

## 285) Harden Semantic Diagnostics For Remaining Emission-Time Failures

- [x] Search `src/cpp/` for reachable `throw new Error` or unsupported-shape failures in emitter paths.
- [x] Inspect generator, class, operator, destructuring, and module-emission error paths before editing.
- [x] Add semantic diagnostics for reachable unsupported generator expression or statement shapes.
- [x] Add semantic diagnostics for reachable unsupported `super` assignment or private-member target shapes.
- [x] Add semantic diagnostics for reachable unsupported destructuring assignment targets.
- [x] Add semantic diagnostics for reachable unsupported operator operand shapes where the emitter still rejects them.
- [x] Preserve successful generated C++ output for supported forms.
- [x] Preserve diagnostic ordering for existing semantic failures.
- [x] Add focused semantic tests under `test/semantic/`.
- [x] Add public API diagnostic tests under `test/api/`.
- [x] Run relevant output or compile tests for each touched feature area.
- [x] Update `docs/diagnostics.md` and focused feature docs when user-visible diagnostics change.

## 286) Improve Generated Project Metadata And Build Hints

- [x] Inspect `src/output/write-dependency-plan.js`, `src/output/write-build-hints.js`, `src/output/write-project-manifests.js`, and generated project docs.
- [x] Add dependency-plan entries explaining why each `jayess:*` runtime feature was included.
- [x] Add platform adapter metadata for `window`, `net`, `gpu`, `clipboard`, `watch`, and `subprocess`.
- [x] Add build-hint entries for platform libraries required by host adapters.
- [x] Add build-hint entries for optional GPU backend requirements.
- [x] Add generated metadata for standard-library modules copied into the output project.
- [x] Preserve deterministic ordering in all generated metadata files.
- [x] Preserve `transpile(source)` behavior as string-only and non-file-writing.
- [x] Add output tests under `test/output/` for metadata content and deterministic ordering.
- [x] Add compile tests only where build hints affect generated C++ includes or adapter files.
- [x] Update `docs/generated-project-layout.md`, `docs/generated-project-shape.md`, and `docs/standard-library.md`.

## 287) Deepen `jayess:window` Presentation And Event Handling

- [x] Inspect `stdlib/jayess/window/`, `src/cpp/runtime-window-source.js`, platform window adapter files, and current window tests.
- [x] Preserve the existing `jayess:window` public imports and host-unavailable diagnostics.
- [x] Strengthen `present(window, canvas)` to validate canvas/image handles and route presentation through the platform adapter boundary.
- [x] Add or complete software-buffer presentation for the supported host adapter path without moving drawing logic into `jayess:window`.
- [x] Add normalized close event objects from platform adapters.
- [x] Add normalized resize event objects with width and height fields.
- [x] Add normalized keyboard event objects with key, code, and pressed fields where available.
- [x] Add normalized mouse move event objects with x and y fields.
- [x] Add normalized mouse button event objects with button, x, y, and pressed fields.
- [x] Add `shouldClose(window)` using the existing window handle state.
- [x] Add `requestClose(window)` using the existing close/event model.
- [x] Keep Windows, macOS, and Linux adapter logic in focused platform files.
- [x] Keep `jayess:canvas` as CPU software rendering and keep GPU acceleration separate under `jayess:gpu`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for runtime metadata and adapter inclusion.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that either exercise the available host adapter or assert normalized platform-unavailable diagnostics.
- [x] Update `docs/jayess-window-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 288) Add `jayess:canvas` Ellipse, Curve, And Text Convenience Helpers

- [x] Inspect `stdlib/jayess/canvas/`, `stdlib/jayess/font/`, `stdlib/jayess/image/`, and current canvas/font tests.
- [x] Preserve CPU software rendering as the default canvas path.
- [x] Add `fillEllipse(canvas, centerX, centerY, radiusX, radiusY, color)`.
- [x] Add `strokeEllipse(canvas, centerX, centerY, radiusX, radiusY, color)`.
- [x] Add focused diagnostics for negative ellipse radii.
- [x] Add `quadraticCurve(canvas, x1, y1, controlX, controlY, x2, y2, color, options)`.
- [x] Add `bezierCurve(canvas, x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, options)`.
- [x] Implement curve rasterization in small Jayess helper functions using existing `line` drawing.
- [x] Add clipping-aware line or polygon helpers where they reuse existing clipping logic cleanly.
- [x] Add `text(canvas, text, x, y, options)` as a canvas convenience helper aligned with the `jayess:font` role.
- [x] Add `measureText(canvas, text, options)` as a canvas convenience helper aligned with the `jayess:font` role.
- [x] Avoid creating an import cycle between `jayess:canvas` and `jayess:font`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that verify deterministic pixels and output files under `temp/`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-font-module.md`, and `docs/standard-library.md`.

## 289) Deepen `jayess:image` Metadata And Simple Formats

- [x] Inspect `stdlib/jayess/image/`, `src/cpp/runtime-image-source.js`, and current image runtime tests.
- [x] Preserve existing PPM and BMP behavior.
- [x] Add `metadataFromFile(path)` for supported image files without loading all pixels when practical.
- [x] Add PPM metadata parsing for width and height.
- [x] Add BMP metadata parsing for width and height.
- [x] Add focused diagnostics for unsupported image metadata formats.
- [x] Add `savePgm(image, path)` for deterministic grayscale output.
- [x] Add `loadPgm(path)` for focused ASCII PGM input.
- [x] Add `saveTga(image, path)` for simple uncompressed TGA output.
- [x] Add `loadTga(path)` for simple uncompressed TGA input.
- [x] Add `encodePpm(image)` returning `jayess:bytes`.
- [x] Add `decodePpm(bytes)` returning an image handle.
- [x] Split file-format helpers from image-buffer helpers if `runtime-image-source.js` grows beyond a focused size.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` using files under `temp/`.
- [x] Update `docs/jayess-image-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 290) Mature `jayess:http` Server Body, Static, And Streaming Utilities

- [x] Inspect `stdlib/jayess/http/`, HTTP runtime source files, `jayess:stream`, `jayess:fs`, `jayess:path`, and `jayess:mime`.
- [x] Preserve existing request, response, router, static-file, and stream helper behavior.
- [x] Add request body stream consumption for server request objects where the runtime already owns body bytes.
- [x] Add focused body-size diagnostics or limits through explicit options.
- [x] Add response chunk streaming support through the existing response handle model.
- [x] Add `serveFiles(root, options)` as a higher-level static directory helper.
- [x] Normalize static path traversal protection using `jayess:path`.
- [x] Add index file handling for static directories.
- [x] Add MIME lookup integration through `jayess:mime`.
- [x] Add cache-header option handling with deterministic defaults.
- [x] Add router grouping helpers only where they fit the current `router`, `route`, `match`, and `handle` model.
- [x] Keep HTTP server runtime changes in focused request, response, and server source files.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for multiple requests, static files, request body, and response streaming.
- [x] Update `docs/jayess-http-module.md`, `docs/jayess-stream-module.md`, and `docs/standard-library.md`.

## 291) Add `jayess:archive` Tar Utilities

- [x] Inspect existing stdlib module patterns, native primitive patterns, and generated metadata for new `jayess:*` modules.
- [x] Add `docs/jayess-archive-module.md`.
- [x] Add `stdlib/jayess/archive/index.js`.
- [x] Add `createTar(entries)` returning `jayess:bytes` for focused tar archives.
- [x] Add `extractTar(bytes)` returning deterministic entry objects.
- [x] Add `writeTar(path, entries)` using `jayess:fs` default async naming if implemented as async.
- [x] Add `writeTarSync(path, entries)` if a synchronous file helper is added.
- [x] Add `readTar(path)` using `jayess:fs` default async naming if implemented as async.
- [x] Add `readTarSync(path)` if a synchronous file helper is added.
- [x] Support regular file entries with path, bytes/text content, and mode metadata.
- [x] Normalize archive paths to prevent absolute paths and `..` traversal.
- [x] Add focused diagnostics for unsupported tar entry types.
- [x] Keep compression out of this first tar utility slice.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` using files under `temp/`.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 292) Add `jayess:validate` Runtime Validation Helpers

- [x] Inspect existing pure Jayess stdlib modules and diagnostics patterns.
- [x] Add `docs/jayess-validate-module.md`.
- [x] Add `stdlib/jayess/validate/index.js`.
- [x] Add primitive schema helpers for `string`, `number`, `boolean`, `array`, `object`, and `nullable`.
- [x] Add `optional(schema)` for optional object fields represented by `null` or missing values according to Jayess semantics.
- [x] Add `arrayOf(schema)`.
- [x] Add `objectOf(shape)` for focused object shape validation.
- [x] Add `oneOf(values)` for exact allowed values.
- [x] Add `validate(schema, value)` returning a result object with `ok`, `value`, and `errors`.
- [x] Add `assertValid(schema, value)` throwing focused diagnostics on invalid values.
- [x] Keep this module pure Jayess with no native runtime primitives unless a narrow primitive is required.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/`.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 293) Improve Generated Build Metadata For Local Compilation

- [x] Inspect `src/output/write-build-hints.js`, `src/output/write-project-manifests.js`, and generated project docs.
- [x] Preserve `transpile(source)` as string-only and non-file-writing.
- [x] Preserve `transpileFile()` as a transpiler output writer, not a compiler or linker invoker.
- [x] Add C++ standard requirement metadata to `jayess_build_hints.json`.
- [x] Add platform-specific library hint entries for `window`, `gpu`, `net`, `watch`, `clipboard`, and `subprocess`.
- [x] Add include directory rationale entries where generated metadata already knows the source bucket.
- [x] Add optional backend requirement entries for GPU backends.
- [x] Add copied standard-library module metadata to the manifest when not already present.
- [x] Add deterministic ordering tests for all new metadata fields.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests only if generated C++ includes or adapter files change.
- [x] Update `docs/generated-project-layout.md`, `docs/generated-project-shape.md`, and `docs/standard-library.md`.

## 294) Refactor Large Runtime Source Files By Adapter Or Format

- [x] Inspect line counts for `src/cpp/runtime-net-platform-source.js`, `src/cpp/runtime-http-source.js`, `src/cpp/runtime-image-source.js`, and adjacent focused runtime files.
- [x] Split POSIX net adapter helpers from Windows net adapter helpers into focused source fragments.
- [x] Preserve public runtime declarations and generated output behavior for `jayess:net`.
- [x] Split image file-format helpers from image buffer operation helpers if `runtime-image-source.js` grows during image-format work.
- [x] Preserve public runtime declarations and generated output behavior for `jayess:image`.
- [x] Continue HTTP runtime splitting only along request, response, and server lifecycle boundaries.
- [x] Avoid broad renaming and unrelated formatting.
- [x] Add or update focused output tests only where fragment ordering or runtime metadata changes.
- [x] Run relevant output tests under `test/output/`.
- [x] Run relevant compile tests under `test/cpp/`.
- [x] Run relevant generated-C++ runtime tests under `test/runtime/`.
- [x] Update `docs/cpp-emitter-organization.md` when runtime source organization changes.

## 295) Present `jayess:canvas` Pixels Through `jayess:window`

- [x] Inspect `stdlib/jayess/window/`, `stdlib/jayess/canvas/`, `stdlib/jayess/image/`, `src/cpp/runtime-window-source.js`, and platform window adapter files.
- [x] Preserve the existing `jayess:window` public API: `create`, `show`, `close`, `shouldClose`, `requestClose`, `pollEvents`, `present`, `width`, `height`, and `setTitle`.
- [x] Preserve `jayess:canvas` as portable CPU software rendering.
- [x] Keep platform presentation logic inside focused `jayess:window` runtime adapter files.
- [x] Validate that `present(window, canvas)` receives a live window handle and a canvas with a software image buffer.
- [x] Add a focused runtime helper for extracting canvas pixel-buffer dimensions and pixel data without creating a `jayess:window` dependency inside `jayess:canvas`.
- [x] Implement Linux/X11 canvas pixel upload in the Linux window adapter.
- [x] Preserve normalized host-unavailable diagnostics when X11, display access, or the host adapter is unavailable.
- [x] Keep Windows and macOS adapters guarded and structurally aligned with the same presentation boundary.
- [x] Record presented width and height after successful pixel presentation.
- [x] Add output tests under `test/output/` for runtime fragment inclusion and deterministic adapter metadata.
- [x] Add compile tests under `test/cpp/` for importing `jayess:window` with `jayess:canvas`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that either exercise host presentation when available or assert normalized unavailable diagnostics.
- [x] Update `docs/jayess-window-module.md`, `docs/jayess-canvas-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 296) Deepen `jayess:gpu` Command Validation And Backend Capability Metadata

- [x] Inspect `stdlib/jayess/gpu/`, `src/cpp/runtime-gpu-source.js`, GPU backend adapter files, and current GPU tests.
- [x] Preserve the existing `jayess:gpu` public API: `createDevice`, `createSurface`, `createBuffer`, `createTexture`, `createShader`, `createPipeline`, `beginFrame`, `clear`, `draw`, and `endFrame`.
- [x] Keep GPU support optional and separate from `jayess:canvas`.
- [x] Keep real backend code isolated behind Direct3D, Metal, Vulkan, OpenGL, and host backend adapter files.
- [x] Add a runtime capability object for the selected backend, including backend name, availability, and supported command families.
- [x] Add focused validation for device handles.
- [x] Add focused validation for window-backed surface handles.
- [x] Add focused validation for buffer and texture creation options.
- [x] Add focused validation for shader source and pipeline option shapes.
- [x] Add command recording for `clear(frame, color)` using normalized `jayess:color` values.
- [x] Add deterministic validation for `draw(frame, pipeline, resources)` without requiring a real graphics backend.
- [x] Add frame lifecycle diagnostics for commands issued before `beginFrame` or after `endFrame`.
- [x] Preserve backend-unavailable diagnostics for unimplemented real adapters.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for command validation and backend-unavailable behavior.
- [x] Update `docs/jayess-gpu-module.md`, `docs/jayess-native-gui.md`, and `docs/standard-library.md`.

## 297) Mature `jayess:http` Server Lifecycle, Routing, And Streaming

- [x] Inspect `stdlib/jayess/http/`, `stdlib/jayess/stream/`, HTTP runtime source files, and current HTTP runtime tests.
- [x] Preserve existing HTTP client, server, router, response, static file, and streaming helper behavior.
- [x] Strengthen multi-request server lifecycle behavior for one server handle.
- [x] Add deterministic server `close` behavior for active and already-closed server handles.
- [x] Add route matching that ignores query strings when matching route paths.
- [x] Add route parameter extraction for focused patterns such as `/users/:id`.
- [x] Add route result objects that include params without changing existing request fields.
- [x] Add request body stream consumption where the runtime already owns body bytes.
- [x] Add response streaming helpers that send bytes or text streams through the existing response handle model.
- [x] Preserve static-file path traversal protection.
- [x] Add static-file tests for index files, MIME lookup, and not-found behavior.
- [x] Keep HTTP runtime changes split along request, response, server, routing, and static-file boundaries.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for multiple requests, route params, static files, request body streams, and response streams.
- [x] Update `docs/jayess-http-module.md`, `docs/jayess-stream-module.md`, and `docs/standard-library.md`.

## 298) Add `jayess:compress` Byte Compression Helpers

- [x] Inspect existing stdlib module patterns, primitive header patterns, generated runtime fragment registration, and archive/HTTP/bytes module tests.
- [x] Add `docs/jayess-compress-module.md`.
- [x] Add `stdlib/jayess/compress/index.js`.
- [x] Add a focused primitive header under `stdlib/jayess/compress/`.
- [x] Add a focused C++ runtime source fragment for compression helpers.
- [x] Add `gzip(bytes)` returning `jayess:bytes`.
- [x] Add `gunzip(bytes)` returning `jayess:bytes`.
- [x] Add `deflate(bytes)` returning `jayess:bytes`.
- [x] Add `inflate(bytes)` returning `jayess:bytes`.
- [x] Validate that compression helpers receive `jayess:bytes`.
- [x] Add deterministic diagnostics for malformed compressed input.
- [x] Keep tar archive integration out of this first slice unless it reuses the public `jayess:compress` helpers cleanly.
- [x] Avoid introducing a broad external build dependency into the generated project without explicit generated build-hint metadata.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for primitive declarations and runtime metadata.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for round-trip compression using files under `temp/` only when file fixtures are needed.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 299) Harden Package Resolution For Modern Package Layouts

- [x] Inspect `src/modules/resolve-package-import.js`, module graph tests, package fixture directories, and module-resolution docs.
- [x] Preserve closed compile-time module graph behavior.
- [x] Preserve rejection of dynamic `import()` and runtime source-module loading.
- [x] Add support for focused package `exports` pattern targets such as `"./features/*"`.
- [x] Add support for package `exports` arrays when an entry is a supported string target.
- [x] Add support for package `exports` arrays when an entry is a supported condition object.
- [x] Add deterministic diagnostics when every array entry is unsupported.
- [x] Add deterministic diagnostics when pattern replacement points outside the package root.
- [x] Add dependency-plan metadata explaining which package export branch was selected.
- [x] Add package self-reference tests for normal entry points.
- [x] Add package self-reference tests for export patterns.
- [x] Keep resolver changes focused under `src/modules/`.
- [x] Add fixture packages under `test/fixtures/`.
- [x] Add module graph tests under `test/modules/`.
- [x] Add API tests under `test/api/` for public diagnostic behavior.
- [x] Update `docs/module-resolution.md`, `docs/builtin-module-policy.md`, and `docs/standard-library.md` if user-visible behavior changes.

## 300) Complete More Deterministic Generator And Class Shapes

- [x] Inspect `docs/feature-matrix.md`, `docs/generator-lowering.md`, `docs/semantics.md`, generator emitter files, class emitter files, and semantic class/generator tests.
- [x] Preserve async generators as unsupported unless `Jayess.md` changes.
- [x] Preserve JavaScript `Promise` as unsupported by design.
- [x] Add support for one additional deterministic generator expression-yield position.
- [x] Add support for one additional generator `try/finally` resume shape with multiple direct yields.
- [x] Add semantic diagnostics for any remaining reachable unsupported generator shapes found during the slice.
- [x] Preserve sent-value resume behavior for all supported generator shapes.
- [x] Add support for one additional deterministic class `super` member read or call shape if it fits current class semantics.
- [x] Preserve unsupported `super` property assignment diagnostics unless implementing a focused assignment slice.
- [x] Add focused diagnostics for invalid private/static class member combinations if gaps remain.
- [x] Keep generator lowering changes in focused generator files.
- [x] Keep class lowering changes in focused class files.
- [x] Add semantic tests under `test/semantic/`.
- [x] Add API/output tests under `test/api/` or `test/output/` where generated code changes.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for resume and class behavior.
- [x] Update `docs/generator-lowering.md`, `docs/semantics.md`, `docs/feature-matrix.md`, and `docs/limitations.md`.

## 301) Improve Generated Project Build Hints For Platform Modules

- [x] Inspect `src/output/write-build-hints.js`, `src/output/write-project-manifests.js`, generated dependency-plan code, and generated project docs.
- [x] Preserve `transpile(source)` as string-only and non-file-writing.
- [x] Preserve `transpileFile()` as a transpiler output writer, not a compiler or linker invoker.
- [x] Add or refine platform library hints for `jayess:window`.
- [x] Add or refine platform library hints for `jayess:gpu`.
- [x] Add or refine platform library hints for `jayess:net`.
- [x] Add or refine platform library hints for `jayess:watch`.
- [x] Add or refine platform library hints for `jayess:subprocess`.
- [x] Add generated metadata for optional backend requirements without making optional backends mandatory.
- [x] Add generated metadata for native-backed standard-library modules copied into the output project.
- [x] Preserve deterministic ordering in build hints, manifests, and dependency plans.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests only if generated C++ includes or adapter files change.
- [x] Update `docs/generated-project-layout.md`, `docs/generated-project-shape.md`, and `docs/standard-library.md`.

## 302) Keep Large Source And Test Files Reviewable During New Work

- [x] Inspect current line counts for `src/`, `stdlib/`, `test/`, and `docs/` before adding new implementation slices.
- [x] Avoid adding unrelated logic to `src/cpp/emit-module.js`.
- [x] Avoid adding unrelated logic to `src/cpp/runtime-http-source.js`.
- [x] Avoid adding unrelated logic to `stdlib/jayess/canvas/index.js`.
- [x] Avoid adding unrelated tests to `test/modules/module-graph.test.js`.
- [x] Split new window presentation tests into focused files under `test/modules/`, `test/output/`, `test/cpp/`, or `test/runtime/`.
- [x] Split new GPU validation tests into focused files under `test/modules/`, `test/output/`, `test/cpp/`, or `test/runtime/`.
- [x] Split new HTTP routing and streaming tests into focused files under `test/modules/`, `test/output/`, `test/cpp/`, or `test/runtime/`.
- [x] Extract one focused helper file when a touched source file approaches the repository file-size guidance.
- [x] Preserve public APIs during organization-only extractions.
- [x] Run relevant focused tests after each extraction.
- [x] Update organization docs under `docs/` when source layout changes.

## 303) Add Native Window Event Polling For `jayess:window`

- [x] Inspect `stdlib/jayess/window/`, `src/cpp/runtime-window-source.js`, platform window adapter files, and current window tests.
- [x] Preserve the existing `jayess:window` public API.
- [x] Preserve `jayess:canvas` as portable CPU rendering and keep window presentation logic inside `jayess:window`.
- [x] Add normalized close-event queuing for host close requests.
- [x] Add normalized resize-event queuing with `width` and `height`.
- [x] Add normalized keyboard event shapes for `keyDown` and `keyUp`.
- [x] Add normalized mouse event shapes for move, button down, and button up.
- [x] Implement Linux/X11 event polling in the Linux adapter.
- [x] Keep Windows and macOS adapters guarded and structurally aligned with the same event boundary.
- [x] Preserve host-unavailable diagnostics for missing display, missing host libraries, and unavailable adapters.
- [x] Add output tests under `test/output/` for event runtime fragment inclusion and adapter metadata.
- [x] Add compile tests under `test/cpp/` for `pollEvents` users.
- [x] Add generated-C++ runtime tests under `test/runtime/` for event queue behavior and unavailable-host diagnostics.
- [x] Update `docs/jayess-window-module.md` and `docs/jayess-native-gui.md`.

## 304) Add Pure Jayess `jayess:kv` Storage Helpers

- [x] Inspect existing pure stdlib module patterns, `jayess:fs`, `jayess:path`, `jayess:json`, and generated stdlib copying behavior.
- [x] Add `docs/jayess-kv-module.md`.
- [x] Add `stdlib/jayess/kv/index.js`.
- [x] Add `open(root, options)` returning a plain store descriptor object.
- [x] Add `get(store, key)` using async default filesystem helpers.
- [x] Add `getSync(store, key)` using synchronous filesystem helpers.
- [x] Add `set(store, key, value)` using JSON serialization and async default filesystem helpers.
- [x] Add `setSync(store, key, value)` using synchronous filesystem helpers.
- [x] Add `has`, `hasSync`, `deleteKey`, `deleteKeySync`, `keys`, and `keysSync`.
- [x] Normalize keys to prevent absolute paths, `..`, path separators, and empty key segments.
- [x] Keep the module pure Jayess unless a narrow primitive is required by existing runtime limits.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/` for generated stdlib inclusion.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` using files under `temp/`.
- [x] Update `docs/standard-library.md` and `docs/standard-library-matrix.md`.

## 305) Add HTTP Cookie Helpers Through `jayess:cookie`

- [x] Inspect `jayess:http`, `jayess:form`, `jayess:querystring`, and existing pure text stdlib module patterns.
- [x] Add `docs/jayess-cookie-module.md`.
- [x] Add `stdlib/jayess/cookie/index.js`.
- [x] Add `parse(header)` returning a plain Jayess object.
- [x] Add `serialize(name, value, options)` returning a `Set-Cookie` header string.
- [x] Add `get(request, name)` helper layered over `jayess:http` header access.
- [x] Add `set(response, name, value, options)` helper layered over `jayess:http` response headers.
- [x] Support focused options: `path`, `domain`, `maxAge`, `expires`, `httpOnly`, `secure`, and `sameSite`.
- [x] Validate cookie names, values, and option shapes with deterministic diagnostics.
- [x] Keep the module pure Jayess unless a narrow primitive is required by existing runtime limits.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for parse, serialize, request read, and response write helpers.
- [x] Update `docs/jayess-http-module.md`, `docs/standard-library.md`, and `docs/standard-library-matrix.md`.

## 306) Deepen `jayess:canvas` Text And Layout Drawing Helpers

- [x] Inspect `stdlib/jayess/canvas/`, `stdlib/jayess/font/`, `stdlib/jayess/layout/`, and current canvas tests.
- [x] Preserve existing canvas drawing exports and CPU software rendering behavior.
- [x] Add `saveImage(canvas, path)` as a stable generic image-save helper over existing deterministic image output.
- [x] Add `drawTextBox(canvas, text, rect, options)` layered over `jayess:font` measurement and drawing helpers.
- [x] Add focused text wrapping for width-constrained text boxes.
- [x] Add horizontal alignment options for `left`, `center`, and `right`.
- [x] Add vertical alignment options for `top`, `middle`, and `bottom`.
- [x] Add deterministic diagnostics for invalid canvas handles, rectangles, colors, and text-box options.
- [x] Keep new helpers in focused stdlib files or helper modules if `stdlib/jayess/canvas/index.js` grows further.
- [x] Add module graph tests under `test/modules/`.
- [x] Add output tests under `test/output/`.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` that write deterministic image files under `temp/`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-font-module.md`, and `docs/jayess-native-gui.md`.

## 307) Add First Real `jayess:gpu` Clear-Frame Backend Slice

- [x] Inspect `src/cpp/runtime-gpu-source.js`, GPU backend adapter files, window adapter files, and generated build-hint metadata.
- [x] Preserve the existing `jayess:gpu` public API.
- [x] Preserve optional GPU behavior and keep `jayess:canvas` independent from GPU support.
- [x] Add a minimal backend adapter path that can clear a window-backed surface.
- [x] Keep backend-specific code inside focused GPU adapter files.
- [x] Preserve deterministic command validation before backend execution.
- [x] Route recorded `clear(frame, color)` commands through the backend adapter boundary.
- [x] Preserve backend-unavailable diagnostics when the selected backend or host surface is unavailable.
- [x] Add generated build-hint metadata for any platform libraries required by the backend slice.
- [x] Add output tests under `test/output/` for backend metadata and generated runtime fragments.
- [x] Add compile tests under `test/cpp/`.
- [x] Add generated-C++ runtime tests under `test/runtime/` for clear-frame behavior or normalized unavailable diagnostics.
- [x] Update `docs/jayess-gpu-module.md`, `docs/jayess-window-module.md`, and `docs/jayess-native-gui.md`.

## 308) Keep Reviewability While Adding The Next Feature Slices

- [x] Inspect current line counts for `src/`, `stdlib/`, `test/`, and `docs/` before implementation.
- [x] Avoid adding unrelated logic to `src/cpp/emit-module.js`.
- [x] Avoid adding unrelated logic to `src/cpp/runtime-http-source.js`.
- [x] Avoid adding unrelated logic to `stdlib/jayess/canvas/index.js`.
- [x] Avoid adding unrelated tests to `test/modules/module-graph.test.js`.
- [x] Split new window event tests into focused files under `test/modules/`, `test/output/`, `test/cpp/`, or `test/runtime/`.
- [x] Split new storage, cookie, canvas, and GPU tests by module and behavior.
- [x] Extract one focused helper file before adding more logic to any file that approaches the repository file-size guidance.
- [x] Preserve public APIs during organization-only extractions.
- [x] Run relevant focused tests after each extraction or feature slice.
- [x] Update organization docs under `docs/` when source layout changes.
