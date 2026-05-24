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
