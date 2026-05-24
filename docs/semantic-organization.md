# Semantic Analyzer Organization

The semantic analyzer keeps `analyzeModule(...)` as the public orchestration entry point while moving focused responsibilities into small helper files.

Current focused helpers include:

- `src/semantic/classes.js` for private member maps and private access validation.
- `src/semantic/control-flow-statements.js` for `break` / `continue` placement validation.
- `src/semantic/expressions.js` for expression-shape diagnostics.
- `src/semantic/finally-control-flow.js` for control-flow validation inside `finally` blocks.
- `src/semantic/generator-forms.js` for generator-yield form scanning.
- `src/semantic/generator-try-shapes.js` for supported generator `try` shape classification used by diagnostics.
- `src/semantic/identifiers.js` for identifier resolution, unsupported built-in messages, and closure capture marking.
- `src/semantic/imports.js` for import-form and native-header validation.
- `src/semantic/module-surface.js` for module-scope binding collection, import/export surface recording, block declaration binding, and parameter binding.
- `src/semantic/scope.js` for lexical scope creation and lookup.

`src/semantic/analyze.js` still owns the main AST walk and semantic context threading. New analyzer work should prefer narrow helpers when behavior can be preserved without broad rewrites.
