# JavaScript Feature Gaps

This document summarizes where Jayess currently differs from JavaScript and which familiar JavaScript features are still missing.

## String Interpolation

Jayess currently supports JavaScript-style template literals using backticks and `${expr}` interpolation.

This means:

- `"Hello {name}"` is just a normal string containing literal `{` and `}` characters.
- `'Hello {name}'` is also just a normal string.
- `` `Hello ${name}` `` is supported.
- tagged templates are not currently supported.

A bare `{someVariable}` inside ordinary quoted strings is not treated as interpolation today.

## Supported JavaScript-Like Features

Jayess already supports a useful subset of familiar JavaScript-like syntax:

- `var` and `const`
- block scope
- functions and closures
- classes, methods, fields, and static members
- `if`, `for`, `while`, `break`, and `continue`
- `switch` with literal cases and explicit non-fallthrough semantics
- `try`, `catch`, and `finally` with direct C++ exception mapping
- `throw expr;`
- arrays and objects
- call spread in ordinary calls, optional calls, and `new` argument lists
- array spread in array literals
- object spread in object literals
- rest parameters
- array/string `.length`, array `.push(...)`, array `.pop()`, array `.join(...)`, and string `.slice(...)` / `.substring(...)` / `.startsWith(...)`
- primitive `.toString()` for strings, numbers, booleans, and null
- imports, exports, default exports, re-exports, and namespace imports
- numeric, string, boolean, and null literals
- arithmetic, comparison, equality, logical, and selected unary operators

See [overview.md](./overview.md) for the current supported feature list.

## Intentionally Different From JavaScript

Jayess is JavaScript-like, but it is not JavaScript:

- `var` is block-scoped, not JavaScript-style function-scoped.
- JavaScript-style `var` hoisting is not supported.
- `let` is not supported.
- Jayess is transpiled to C++, so runtime semantics are intentionally stricter and more explicit.
- Jayess does not provide the Node.js runtime by default.
- Equality, truthiness, and numeric behavior are narrower and more explicit than full JavaScript semantics.
- Scope-based lifetime behavior is part of the language design, unlike JavaScript garbage collection.

## Syntax Features Still Missing

The following familiar JavaScript syntax is not currently documented as supported:

- assignment-pattern destructuring
- nested destructuring patterns
- generators and `yield`
- `import()` dynamic import
- `export default` expressions beyond the currently supported forms already documented
- `super`
- inheritance with `extends`
- private class fields
- computed class member names
- static initialization blocks

Some of these may parse poorly or fail with generic unsupported diagnostics today. They should not be treated as implemented until the transpiler and docs explicitly support them.

`async` / `await` now has a narrow first shipped slice through `async function` declarations and `await expr` inside async function bodies. Async function expressions, async arrow functions, async methods/constructors, and top-level `await` are still outside the current slice. See [async-await-roadmap.md](./async-await-roadmap.md).

Generators now have syntax/semantic groundwork through generator declarations plus `yield` / `yield*`, but generator declarations still stop with explicit semantic diagnostics until lowering/runtime work lands, and generator function expressions are still outside the first shipped slice. See [generators-roadmap.md](./generators-roadmap.md).

Inheritance via `extends` and `super` now also fails with explicit diagnostics because the implementation is not complete yet. See [inheritance-roadmap.md](./inheritance-roadmap.md).

Private class fields now also fail with explicit diagnostics because the implementation is not complete yet. See [private-fields-roadmap.md](./private-fields-roadmap.md).

Computed class member names and static initialization blocks now also fail with explicit diagnostics because the implementation is not complete yet. See [class-members-roadmap.md](./class-members-roadmap.md).

Large runtime built-ins such as `Date`, `Promise`, `Map`, `Set`, and `JSON` are planned as explicit Jayess library/runtime features rather than ambient JavaScript globals. See [runtime-builtins-roadmap.md](./runtime-builtins-roadmap.md).

## Runtime And Standard Library Features Still Missing

Jayess also does not currently claim broad JavaScript runtime compatibility. Common missing areas include:

- `undefined` as a first-class JavaScript value model
- JavaScript `Date`
- `RegExp`
- `Promise`
- `Map`, `Set`, `WeakMap`, and `WeakSet`
- broad `Array.prototype` method coverage beyond `.push(...)`, `.pop()`, and `.join(...)`
- broad `String.prototype` method coverage beyond `.length`, `.slice(...)`, `.substring(...)`, `.startsWith(...)`, and primitive `.toString()`
- `parseInt` and `parseFloat`
- full `Object` utility coverage
- JSON APIs
- exception/runtime error compatibility with JavaScript
- built-in browser globals
- built-in Node.js globals and APIs

## Module And Platform Gaps

These JavaScript ecosystem expectations are also intentionally narrower today:

- Node built-ins such as `node:fs`, `node:path`, and `node:url` are not automatically available inside Jayess source.

`node:` imports now fail with explicit unsupported diagnostics instead of being treated like ordinary package imports. See [node-builtins-roadmap.md](./node-builtins-roadmap.md).
- npm package resolution exists, but not every JavaScript package is a valid Jayess package.
- Native headers and native libraries are supported as dependency artifacts, but JavaScript packages are not treated as C++ bindings automatically.
- The transpiler emits C++ source, not direct executable binaries as its primary product.

## Semantics That Need More Tightening

Some areas exist today but still need clearer long-term Jayess rules:

- exact truthiness behavior across all runtime value kinds
- exact equality behavior for composites and callables
- numeric coercion rules
- built-in property and method surface for arrays, objects, strings, and numbers
- exact template-literal stringification semantics for all runtime value kinds

## Roadmap Direction

The current checklist roadmap is being extended with focused, small-step milestones for:

- default parameters
- trailing commas
- compound assignment and update expressions
- richer composite-value operations
- narrow built-in library support
- diagnostics quality
- module/output polish
- semantic tightening

The preferred long-term direction for many larger remaining features is:

- a **small C++ runtime** for primitives Jayess cannot express yet
- **Jayess-written standard-library and higher-level core modules** for behavior that can be implemented in Jayess and transpiled into the output project
