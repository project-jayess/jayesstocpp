# Unsupported By Design

The items below are not active feature gaps unless [Jayess.md](../Jayess.md) changes.

- `let`
- JavaScript-style `undefined` as a separate value from `null`
- JavaScript `Promise` as a language/runtime surface
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`
- ambient Node.js built-ins in Jayess source
- source-code loading or runtime module discovery from compiled Jayess code
- JavaScript-style hoisted/function-scoped `var`
- broad JavaScript coercion semantics
- full JavaScript compatibility as a goal

Jayess is a compiled, JavaScript-like native language. The supported surface should stay deterministic, statically discoverable, and explicit about runtime handles.
