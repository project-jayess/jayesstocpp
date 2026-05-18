# Jayess Language Notes

This file records the current language-direction rules for Jayess as a JavaScript-like **compiled native programming language**.

Jayess is meant to feel familiar to JavaScript developers, but it is not trying to reproduce every dynamic JavaScript runtime feature. If a JavaScript feature conflicts with deterministic compilation, closed compile-time module resolution, explicit semantics, or Jayess scope-based lifetime rules, Jayess should not implement that feature as-is.

## Supported Direction

Jayess prefers:

- JavaScript-like syntax where it maps cleanly to compiled native behavior
- explicit module graphs resolved at transpile time
- predictable lexical scope
- explicit runtime/value semantics
- a small C++ primitive runtime
- Jayess-written standard-library and higher-level core modules where practical

## Not Supported By Design

The following JavaScript features are not part of Jayess by design:

- `let`
- JavaScript-style `undefined` as a separate first-class value distinct from `null`
- JavaScript `Promise` as a language/runtime surface
- dynamic `import()`
- `eval(...)`
- `Function(...)` source-evaluation constructor
- `with`
- JavaScript-style `var` hoisting and function-scoped `var`
- runtime module loading by computed source path
- implicit browser-style script/global loading

## Unsupported By Design

In practical terms, these are the JavaScript features Jayess should continue to reject as language features rather than treat as pending work:

- `let`
- JavaScript-style `undefined` as a separate first-class value distinct from `null`
- JavaScript `Promise` as a language/runtime surface
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`
- JavaScript-style hoisted/function-scoped `var`

Jayess uses `null` as its only built-in “missing” sentinel in the current language direction.
Jayess also keeps `async` / `await` as Jayess-owned language/runtime behavior rather than adopting JavaScript `Promise` programming style.

Jayess also keeps truthiness, equality, and numeric operators explicit rather than coercive:

- empty arrays, empty objects, empty maps, and empty sets are falsey
- equality is exact-type and identity-based for composite/runtime-handle values
- JavaScript-style numeric coercion such as `"5" + 1`, `"5" - 1`, or `true + 1` is not part of the language

## General Rule

If a JavaScript feature requires any of the following, Jayess should not implement that feature as-is:

- runtime parsing of new source text
- runtime discovery/loading of source modules by computed path
- breaking predictable lexical name resolution
- preserving legacy JavaScript hoisting behavior that Jayess intentionally replaced
- undermining deterministic lowering, static module closure, or scope-based lifetime analysis

## Why These Are Out Of Scope

### `let`

Jayess `var` already fills the block-scoped mutable-binding role.

Jayess does not want two keywords for the same main mutable-binding concept. `var` is the language keyword, and it behaves more like JavaScript `let` than JavaScript `var`.

### Dynamic `import()`

Jayess is compiled through a closed module graph. Modules are resolved during transpilation, not loaded dynamically from source text at runtime.

### `eval(...)` And `Function(...)`

Jayess does not support runtime source evaluation. Parsing and lowering new Jayess/JavaScript source at runtime would undermine:

- deterministic compilation
- lexical scope analysis
- module-graph closure
- lifetime/escape analysis
- predictable generated C++ output

### `with`

`with` breaks predictable lexical name resolution and is a bad fit for explicit semantic analysis in a compiled language.

## Policy For Future Features

If a JavaScript feature:

- requires runtime source evaluation
- requires runtime source-module discovery/loading
- destroys predictable lexical scope resolution
- depends on legacy JavaScript hoisting behavior
- or conflicts with Jayess lifetime and compiled-runtime rules

then Jayess should treat it as unsupported by design unless the language is explicitly redesigned around a Jayess-native compiled equivalent.

## Related Documents

- [README.md](./README.md)
- [AGENTS.md](./AGENTS.md)
- [docs/overview.md](./docs/overview.md)
- [docs/javascript-feature-gaps.md](./docs/javascript-feature-gaps.md)
- [docs/limitations.md](./docs/limitations.md)
