# Reachable Symbol Emission

Jayess should emit generated C++ at reachable declaration granularity where it is safe to do so. This is a generated-artifact size and correctness requirement, not only an optimization.

The current module resolver already understands named imports, default imports, namespace imports, side-effect imports, named exports, default exports, and re-exports. The compiler must use named import-list information to avoid whole-module emission for imports shaped like `import { name } from "module"` once this slice is implemented.

## Goal

This named import-list form:

```js
import { readTextSync, writeTextSync } from "jayess:fs";
```

should mark only these exported declarations as externally required from `jayess:fs`:

- `readTextSync`
- `writeTextSync`

The transpiler should then recursively mark:

- local helper declarations referenced by those exports
- imported symbols referenced by those exports or helpers
- native bridge headers and source artifacts required by those reachable calls
- runtime fragments required by reachable emitted code

It should not emit unrelated exports such as temporary-file helpers, JSON helpers, stream helpers, UUID helpers, or crypto helpers when those declarations are not reachable.

This applies equally to user modules, package modules, and repository-owned `jayess:*` modules when they are imported through named import lists. A module file can contain many exports, but a named import list should include only the requested exports and support declarations needed by the program.

Non-named import forms retain the whole resolved module for now:

- default imports such as `import express from "express";`
- namespace imports such as `import * as fs from "jayess:fs";`
- side-effect imports such as `import "./setup.js";`
- mixed import forms that include a default or namespace binding

## Conservative Fallbacks

Whole-module emission remains valid for non-named import forms and when the compiler cannot prove a smaller named-import surface is safe. Use it for:

- default imports
- side-effect imports
- namespace imports
- mixed default/named or namespace/named imports
- modules with required top-level side-effect statements
- ambiguous re-export chains
- import cycles where declaration-level initialization order is not yet proven safe
- unsupported AST shapes in the reachability analyzer

Fallbacks must be explicit in generated metadata so binary-size regressions are explainable. A fallback is acceptable only when it preserves correctness that the current analyzer cannot prove with a smaller retained set.

## Module Initialization

Top-level initialization must remain semantically correct.

The reachability pass should distinguish:

- declarations that can be emitted only when referenced
- top-level statements that must run during module initialization
- top-level variables whose initializers are required by reachable declarations
- imports that exist only because an emitted declaration uses them

If a module has top-level executable statements that are not safely separable from declarations, emit the whole module until finer analysis is implemented and record that fallback reason.

## Standard Library Impact

Repository-owned `jayess:*` modules should remain normal Jayess modules. Users should not need artificial submodule imports only to avoid binary bloat.

Focused standard-library files are still useful for maintainability, but the compiler should make named import lists efficient:

```js
import { prompt, writeLine } from "jayess:console";
import { readTextSync, writeTextSync } from "jayess:fs";
```

Expected generated output should include the console prompt/write helpers and the FS text read/write helpers, not every exported helper from both modules.

Standard-library authors should still keep files focused, but they should not need to split every export into a separate file merely to prevent generated executable bloat for named import lists. Other import forms intentionally retain whole modules until a later policy narrows those cases.

## Metadata

Generated metadata should expose reachability decisions for review and tooling:

- requested import names per dependency edge
- reachable exported names per module
- retained declarations per module
- pruned declarations per module where practical
- fallback reason when a module uses whole-module emission
- native artifacts retained because reachable declarations require them
- runtime fragments retained because reachable declarations require them

This metadata belongs in existing generated project metadata where possible, or in a focused companion file if needed.

## Current Implementation State

The current implementation records import-form and named-list reachability metadata in generated project files. This includes dependency-level fields in `jayess_dependency_plan.json`, `jayess_module_manifest.json`, and `jayess_dependency_graph.json`:

- `importForm`
- `requestedImportNames`
- `importBindings`
- `reachableExports`
- `wholeModuleReason`

It also writes `jayess_reachability.json` with module-level:

- `declarationReferences`
- `reachableExports`
- `retainedExports`
- `prunedExports`
- `retainedLocalDeclarations`
- `retainedImportLocals`
- `wholeModuleReasons`

The same file also records broad retained output lists:

- `retainedRuntimeFragments`
- `retainedNativeArtifacts`

The declaration-reference metadata tracks direct local declaration references and import-local references for retained declarations. The C++ emitter can consume a retained declaration set for modules where declaration-level pruning is known safe.

Current declaration pruning is intentionally conservative:

- non-stdlib modules with declaration-only top-level shapes can omit unreachable exported and local declarations
- `jayess:fs` supports declaration pruning for named text-helper imports such as `readTextSync` and `writeTextSync`; unrelated FS exports, transitive stdlib dependency modules, native bridge headers, and optional runtime fragments are omitted when unreachable
- modules with default, namespace, side-effect, or mixed imports remain whole-module fallbacks
- modules with ambiguous `export *` forwarding or non-declaration top-level executable statements remain whole-module fallbacks
- import cycles are rejected during module graph construction rather than emitted as declaration-pruned or whole-module output
- repository-owned `jayess:*` modules other than explicitly enabled pruning slices still use whole-module fallback behavior
- native artifact imports with named bindings can be omitted from copied artifacts and reachability metadata when those bindings are used only by unreachable declarations
- native source/library side-effect imports are still copied because the import itself declares a required dependency artifact rather than a callable symbol surface
- optional runtime fragments used only by unreachable emitted declarations can be omitted for declaration-pruned modules, including the focused `jayess:fs` text-helper slice
- the `class` runtime fragment remains part of the baseline because core member lookup currently depends on class helper declarations even in class-free programs

Generated source lists may be smaller than the analyzed module graph. A dependency can appear in graph metadata because it was resolved and analyzed, while its C++ files are omitted when no retained declaration, retained re-export alias, or whole-module fallback requires it.
