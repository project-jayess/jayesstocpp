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
- array/string `.length`, array `.push(...)`, array `.pop()`, array `.join(...)`, array `.includes(...)`, and string `.slice(...)` / `.substring(...)` / `.startsWith(...)` / `.includes(...)` / `.indexOf(...)` / `.endsWith(...)`
- primitive `.toString()` for strings, numbers, booleans, and null
- imports, exports, default exports, re-exports, and namespace imports
- numeric, string, boolean, and null literals
- arithmetic, comparison, equality, logical, and selected unary operators

See [overview.md](./overview.md) for the current supported feature list.

## Intentionally Different From JavaScript

Jayess is JavaScript-like, but it is not JavaScript:

- `var` is block-scoped, not JavaScript-style function-scoped.
- JavaScript-style `var` hoisting is not supported.
- `let` is not supported because Jayess `var` already fills that role.
- Jayess does not add a separate JavaScript-style `undefined` value; the language direction keeps `null` as the only built-in missing-value sentinel.
- Jayess does not adopt JavaScript `Promise` as a language/runtime surface; async behavior is Jayess-owned.
- Jayess is transpiled to C++, so runtime semantics are intentionally stricter and more explicit.
- Jayess does not provide the Node.js runtime by default.
- Equality, truthiness, and numeric behavior are narrower and more explicit than full JavaScript semantics.
- Scope-based lifetime behavior is part of the language design, unlike JavaScript garbage collection.
- Jayess does not support runtime source evaluation through `eval(...)` or `Function(...)`.
- Jayess does not support dynamic module loading through `import()`.
- Jayess does not support `with`.

Jayess also prefers one explicit missing-value sentinel:

- `null` is the only built-in missing-value sentinel
- Jayess does not add a separate JavaScript-style `undefined`
- missing lookups and implicit results are intended to resolve through `null`, not through a second “missing” value kind

Jayess also prefers explicit truthiness/equality/coercion rules:

- empty arrays, empty objects, empty maps, and empty sets are falsey
- equality is exact-type and identity-based for composite/runtime-handle values
- JavaScript-style numeric coercion such as `"5" + 1`, `"5" - 1`, or `true + 1` is intentionally absent

## Syntax Features Still Missing

The following familiar JavaScript syntax is not currently documented as supported:

- `export default` expressions beyond the currently supported forms already documented

Unsupported-by-design features such as `let`, dynamic `import()`, `eval(...)`, `Function(...)`, and `with` now fail with focused diagnostics. Remaining unimplemented forms may still fail with narrower generic unsupported diagnostics until their own slices are defined and shipped.

Destructuring now supports nested patterns, pattern defaults, assignment destructuring into existing identifiers, and destructuring declarations in `for` initializers.

Some JavaScript features are not merely “not implemented yet”; they are intentionally unsupported because Jayess is a compiled language with closed module resolution. That currently includes:

- `let`
- JavaScript-style `undefined` as a separate first-class value
- JavaScript `Promise` as a language/runtime surface
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`

See [../Jayess.md](../Jayess.md) for the language-direction policy behind those non-goals.

`async` / `await` now has a narrow shipped slice through `async function` declarations, async function expressions, async arrow functions, and `await expr` inside those async function bodies. JavaScript `Promise` is unsupported by design, and the first shipped Jayess-owned composition surface is `resolved`, `rejected`, `all`, `race`, and `isAsync` through `jayess:async`.

Generators now have a narrow shipped slice through generator declarations, generator function expressions, generator class methods, and direct `yield` / `yield*`.

Inheritance now has a narrow first shipped slice through single inheritance, `extends`, `super(...)`, and `super.method(...)`.

Private class fields now have a narrow shipped slice through private instance fields and private instance methods.

Computed class member names and static initialization blocks now have a narrow first shipped slice.

Large runtime built-ins such as `Date`, `Map`, `Set`, and `JSON` are treated as explicit Jayess library/runtime features rather than ambient JavaScript globals. Narrow module-owned slices are now shipped through `jayess:date`, `jayess:json`, `jayess:collections/map`, and `jayess:collections/set`.

Regular-expression support now has a narrow shipped first slice through `jayess:regex`, with helper exports `create`, `test`, `exec`, `replaceFirst`, `replaceAll`, and `isRegex`.

The standard-library expansion work is intentionally bounded: array `includes(value)`, the string `includes` / `indexOf` / `endsWith` slice, the first `jayess:object` helper surface, and the first `jayess:number` parsing surface are now shipped.

## Runtime And Standard Library Features Still Missing

Jayess also does not currently claim broad JavaScript runtime compatibility. Common missing areas include:

- `undefined` as a first-class JavaScript value model
- JavaScript `Date` global compatibility beyond the shipped `jayess:date` module surface
- broader regex support beyond the shipped `jayess:regex` helper-only slice
- ambient/global `Map` and `Set` compatibility, plus `WeakMap` and `WeakSet`
- broad `Array.prototype` method coverage beyond `.push(...)`, `.pop()`, `.join(...)`, and `.includes(...)`
- broad `String.prototype` method coverage beyond `.length`, `.slice(...)`, `.substring(...)`, `.startsWith(...)`, `.includes(...)`, `.indexOf(...)`, `.endsWith(...)`, and primitive `.toString()`
- broader numeric helper coverage beyond shipped `jayess:number` `parseInt(text)` and `parseFloat(text)`
- full `Object` utility coverage beyond the shipped `jayess:object` `keys` / `values` / `entries` module
- broader JSON APIs beyond the shipped `jayess:json` `parse` / `stringify` / `stringifyPretty` / `validate` / `isJsonText` surface
- exception/runtime error compatibility with JavaScript
- built-in browser globals
- built-in Node.js globals and APIs

## Module And Platform Gaps

These JavaScript ecosystem expectations are also intentionally narrower today:

- Node built-ins such as `node:fs`, `node:path`, and `node:url` are not automatically available inside Jayess source.
- Jayess instead grows host-facing behavior through explicit `jayess:fs`, `jayess:path`, and `jayess:process` slices, and the shipped follow-up work is still narrow rather than broad Node compatibility.

`node:` imports now fail with explicit unsupported diagnostics instead of being treated like ordinary package imports.
- npm package resolution exists, but not every JavaScript package is a valid Jayess package.
- Native headers and native libraries are supported as dependency artifacts, but JavaScript packages are not treated as C++ bindings automatically.
- The transpiler emits C++ source, not direct executable binaries as its primary product.

Module/export hardening direction is also explicit now:

- `export *` remains named-only and does not forward default exports
- package `exports` support stays intentionally narrower than full Node conditional-exports behavior for now
- async module-initialization cycle semantics remain deferred until top-level `await` is ever approved
- duplicate exported names are rejected explicitly
- packages that expose only unsupported conditional export branches now fail with focused diagnostics

## Semantics That Need More Tightening

Some areas exist today but still need clearer long-term Jayess rules:

- exact truthiness behavior across all runtime value kinds
- exact equality behavior for composites and callables
- numeric coercion rules
- built-in property and method surface for arrays, objects, strings, and numbers
- exact template-literal stringification semantics for all runtime value kinds

## Implementation Direction

The preferred long-term direction for larger features is:

- a **small C++ runtime** for primitives Jayess cannot express yet
- **Jayess-written standard-library and higher-level core modules** for behavior that can be implemented in Jayess and transpiled into the output project
