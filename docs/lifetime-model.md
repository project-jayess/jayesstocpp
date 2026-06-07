# Jayess Lifetime Model

Jayess uses scope-based automatic memory handling in generated C++ rather than JavaScript garbage collection. Values that can outlive a scope are treated as escaping so generated code can retain them through runtime value ownership.

## Escaping Values

Escape analysis marks values as escaping when they are:

- returned or thrown
- exported from a module
- retained inside returned arrays or objects
- captured by function expressions, arrow functions, async callables, or generator callables
- captured from block-scoped `var` bindings by closures that outlive the block
- stored into object or array members
- passed through thread worker handoff helpers such as `spawn(worker, args)`
- retained by class field initializers, generator resume state, async callable state, or exported initializer closures

## Feature Families

Generator handles retain their resume lambda and copied captures until completion. Async handles retain their callable state until settlement. Class values retain static state, method closures, private storage keys, and constructor callables through the class value. Thread helpers transfer callback and argument values across worker boundaries instead of borrowing stack-local storage.

Non-escaping locals remain ordinary scope-local generated C++ values. This keeps the memory policy explicit without introducing a garbage collector.

## Generated Lifetime Metadata

`transpileFile()` writes `jayess_lifetime.json` next to the generated project metadata. The file is diagnostic metadata for the current lifetime slice; it is not a user source file and should be regenerated with the project output.

Each module entry records:

- `localBindings`: bindings declared inside the module or nested functions.
- `capturedBindings`: bindings captured by function expressions or arrow functions after semantic analysis.
- `returnedValues`: identifiers observed in return values.
- `thrownValues`: identifiers observed in thrown values.
- `exportedValues`: bindings exposed by named or default exports.
- `storedBindings`: identifiers stored into object/array/member state or top-level module initializers.
- `moduleStateBindings`: top-level function, class, and variable bindings emitted as module state.
- `escapingBindings`: the result of `analyzeEscapes()` for the module.

The C++ emitter currently consumes this metadata for the safe `module-state-bindings` category. That category records top-level bindings that already lower to stable generated module storage. Unsupported lifetime shapes keep explicit fallback metadata:

```json
{
  "strategy": "broad-runtime-value-ownership",
  "reason": "unsupported lifetime shapes preserve current generated C++ ownership behavior"
}
```

This fallback means the emitter preserves the current broad-safe Jayess runtime value ownership path rather than adding partial cleanup rules that could invalidate escaping values.

## Current Non-Goals

- Do not lower every escape category into custom C++ cleanup code in this slice.
- Do not make non-escaping values manually freed by Jayess users.
- Do not replace scope-based lifetime behavior with JavaScript garbage collection.
- Do not infer native ownership rules for imported C++ symbols from lifetime metadata alone.
