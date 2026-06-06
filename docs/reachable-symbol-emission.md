# Reachable Symbol Emission

Jayess should emit generated C++ at reachable declaration granularity where it is safe to do so.

The current module resolver already understands named imports, default imports, namespace imports, side-effect imports, named exports, default exports, and re-exports. The intended next compiler step is to use that information to avoid whole-module emission for ordinary named imports.

## Goal

This import:

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

## Conservative Fallbacks

Whole-module emission remains valid when the compiler cannot prove a smaller surface is safe. Use it for:

- side-effect imports
- namespace imports
- modules with required top-level side-effect statements
- ambiguous re-export chains
- import cycles where declaration-level initialization order is not yet proven safe
- unsupported AST shapes in the reachability analyzer

Fallbacks must be explicit in generated metadata so binary-size regressions are explainable.

## Module Initialization

Top-level initialization must remain semantically correct.

The reachability pass should distinguish:

- declarations that can be emitted only when referenced
- top-level statements that must run during module initialization
- top-level variables whose initializers are required by reachable declarations
- imports that exist only because an emitted declaration uses them

If a module has top-level executable statements that are not safely separable from declarations, emit the whole module until finer analysis is implemented.

## Standard Library Impact

Repository-owned `jayess:*` modules should remain normal Jayess modules. Users should not need artificial submodule imports only to avoid binary bloat.

Focused standard-library files are still useful for maintainability, but the compiler should eventually make this efficient:

```js
import { prompt, writeLine } from "jayess:console";
import { readTextSync, writeTextSync } from "jayess:fs";
```

Expected generated output should include the console prompt/write helpers and the FS text read/write helpers, not every exported helper from both modules.

## Metadata

Generated metadata should expose reachability decisions for review and tooling:

- requested import names per dependency edge
- reachable exported names per module
- retained declarations per module
- pruned declarations per module where practical
- fallback reason when a module uses whole-module emission
- native artifacts retained because reachable declarations require them

This metadata belongs in existing generated project metadata where possible, or in a focused companion file if needed.
