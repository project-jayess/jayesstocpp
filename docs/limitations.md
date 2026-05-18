# Current Limitations

This file lists intentionally incomplete areas of the current Jayess transpiler.

## Export Semantics

Supported today:

- named exports of local bindings
- `export * from "./mod.js"` for named bindings
- default exports of value expressions
- named default-exported function declarations
- anonymous default-exported function declarations
- named default-exported class declarations
- anonymous default-exported class declarations
- default imports
- namespace imports

`export *` currently forwards named bindings only, not default exports.
That remains the approved Jayess rule rather than a pending compatibility gap.
Duplicate exported names are also rejected explicitly rather than being merged implicitly.

## Larger Language Gaps

Still out of scope in the current implementation:

- broad JavaScript compatibility

Unsupported forms currently fail explicitly for:

- `let`
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`
- binding imports from `cpp:<header>` dependencies
- binding imports from native source or native library artifacts
- tagged template literals

The items above are not all equal. `let`, dynamic `import()`, `eval(...)`, `Function(...)`, and `with` are intentionally unsupported by language design, not just waiting for implementation work. Jayess uses block-scoped `var`, closed compile-time module resolution, and no runtime source-evaluation model. See [../Jayess.md](../Jayess.md).
Those permanently unsupported-by-design forms now also fail with focused diagnostics instead of being left to ordinary undefined-name or malformed-import errors.

The current runtime treats `null` as a distinct Jayess value via `std::monostate`. Jayess does not currently aim to add a separate JavaScript-style `undefined` value; `null` is the intended built-in missing-value sentinel. See [semantics.md](./semantics.md).

Unary operator support is still intentionally narrow. `!expr` and `-expr` are supported, but broader JavaScript-style unary operator coverage is not yet implemented.

Logical operator support is currently limited to `&&` and `||`. Broader JavaScript operator coverage is still intentionally incomplete.

Strict equality support currently lowers `===` and `!==` through the same exact-type runtime comparison path used by `==` and `!=`. This is intentionally different from JavaScript, which applies different coercion rules for `==`.

Truthiness is also intentionally explicit rather than JavaScript-like. Empty arrays, empty objects, empty maps, and empty sets are falsey in the current Jayess rule set.

Arithmetic operator coverage is still intentionally incomplete. `%` is supported for numeric values, but broader JavaScript numeric edge-case behavior is not fully modeled. Numeric operators also intentionally assume numeric operands rather than performing JavaScript-style coercion.

Exponentiation is supported through `**`, including right-associative chaining, but the transpiler does not currently model every JavaScript-specific parsing edge case around unary operators and exponentiation.

Unary plus is supported as a numeric identity operation. It is intentionally different from JavaScript-style coercion semantics.

Template literals are supported with backtick-delimited `${expr}` interpolation. Ordinary quoted strings do not interpolate `{name}` text, and tagged templates are still intentionally unsupported.

Default parameters are supported for functions, closures, methods, and constructors. They apply only when an argument is omitted; passing explicit `null` does not trigger the default initializer.

Trailing commas are supported in parameter lists, argument lists, array literals, object literals, import lists, and export lists. Broader JavaScript comma-expression behavior is still intentionally unsupported.

Compound assignment is supported for mutable locals plus property/index targets through `+=`, `-=`, `*=`, `/=`, `%=`, and `**=`.

Prefix and postfix update expressions are supported for mutable locals plus property/index targets through `++` and `--`. Broader JavaScript update semantics beyond those operators remain intentionally narrower than full JavaScript behavior.

Composite built-in coverage is still intentionally small. Arrays and strings support `.length`, arrays support `.push(...)`, `.pop()`, `.join(...)`, and `.includes(...)`, and strings support `.slice(...)`, `.substring(...)`, `.startsWith(...)`, `.includes(...)`, `.indexOf(...)`, and `.endsWith(...)`, but broader `Array.prototype` and `String.prototype` method/property coverage is still unsupported.

String/number built-in coverage is also intentionally narrow. Primitive `.toString()` is supported for strings, numbers, booleans, and null, and a first explicit `jayess:number` parsing slice now ships with `parseInt(text)` and `parseFloat(text)`. Broader JavaScript `Number` emulation and ambient numeric globals are still intentionally unsupported.

Object helper coverage is now also narrow and explicit. Jayess ships `jayess:object` with `keys`, `values`, and `entries`, but that is intentionally different from ambient JavaScript `Object.*` global compatibility.

Arrow functions are supported for ordinary identifier parameters with optional defaults, parenthesized rest parameters, expression bodies, and block bodies. Destructured parameters and `arguments` inside arrow functions are still intentionally unsupported.

Spread support currently includes call-style argument lists, array literals, and object literals. `fn(...items)`, `callback?.(...items)`, `new Point(...coords)`, `[...items, tail]`, and `{ ...base, answer: 1 }` are supported. Rest parameters are also supported through the callable argument model. The current spread runtime path requires Jayess arrays for call/array spread sources and Jayess objects or callables for object spread sources.

Nullish coalescing is supported through `left ?? right`, and it currently treats only `null` as nullish. Jayess does not yet model a separate JavaScript-style `undefined` value.

The intended language direction is to keep that model permanent: `null` is the only built-in missing-value sentinel for implicit results and missing lookups as well. The remaining implementation work is to make all runtime paths follow that rule consistently.

Optional chaining is supported for `obj?.prop`, `obj?.[expr]`, and `fn?.(...)`, and it currently short-circuits to Jayess `null`. Broader JavaScript optional-chaining edge cases are still intentionally out of scope.

Ternary expressions are supported through `condition ? whenTrue : whenFalse`.

Switch statements are supported in a narrow first slice. `case` labels must be literal values, `default` may appear once, and Jayess uses explicit non-fallthrough semantics rather than JavaScript-style fallthrough.

Try/catch/finally is supported in a narrow first slice. Catch clauses support only an optional identifier binding, Jayess `throw expr;` lowers through a dedicated runtime exception carrier, and non-Jayess C++ exceptions still arrive as Jayess strings from `what()`. `finally` blocks also intentionally reject `return`, `break`, and `continue` in this slice so cleanup can lower through a focused RAII guard without changing surrounding control flow.

`async` / `await` now has a narrow shipped slice. `async function` declarations, async function expressions, async arrow functions, and `await expr` inside those async function bodies are supported, and they lower to Jayess-owned async handles with explicit runtime completion state. Async methods remain a separate later class-model slice, async constructors remain unsupported by design, and top-level `await` remains unsupported until Jayess defines explicit module-level async initialization ordering.

Generators now have a narrow shipped slice. Generator declarations and generator function expressions support direct `yield expr` and direct `yield* expr`, and they lower through Jayess-owned generator handles plus explicit state-slot resume lambdas. Generator methods, async generators, and more complex yield nesting are still outside the current shipped slice.

Inheritance now has a narrow first shipped slice. Jayess supports one Jayess class base through `extends`, `super(...)` inside derived constructors, and `super.method(...)` inside derived instance methods. The current slice still excludes static inheritance, computed `super[expr]`, non-class base expressions, and broader JavaScript inheritance flexibility, and `super` property assignment forms remain unsupported rather than pending for the next slice.

Private members now have a narrow shipped slice. Private instance field declarations, private instance methods, and private reads/writes/calls are supported when the access occurs inside methods or field initializers of the declaring class. Private static fields and private static methods remain later separate class-side slices.

Computed class member names and static initialization blocks now have a narrow first shipped slice. Computed instance/static methods and fields are supported, and static fields plus static blocks run in one source-ordered class-side sequence. Static blocks keep ordinary class-name access and do not gain a special class-side `this` binding in the next slice. Static inheritance, richer class-side semantics, and broader JavaScript class edge cases are still intentionally outside the current slice.

Large JavaScript runtime built-ins are intentionally not exposed as ambient globals. Jayess now ships narrow module-owned slices for `jayess:date`, `jayess:json`, `jayess:collections/map`, and `jayess:collections/set`, but it still does not provide ambient `Date`, `Map`, `Set`, or `JSON` objects.

Jayess also does not adopt JavaScript `Promise` as part of the language/runtime surface. `async` / `await` is supported through Jayess-owned async handles and Jayess-owned async composition APIs instead.

These larger remaining features should not automatically be assumed to require large hardcoded C++ runtime implementations. The preferred direction is a small primitive runtime plus Jayess-written standard-library/core modules where practical.

Ambient Node built-ins are not available inside Jayess source imports. Imports such as `node:fs` and `node:path` fail with explicit diagnostics rather than flowing through ordinary package resolution. A narrow first Jayess-owned system-module slice now exists through `jayess:fs`, `jayess:path`, and `jayess:process`, but broader Node-compatible host APIs are still intentionally out of scope.
That shipped slice now includes `jayess:fs` remove/list/rename/stat, `jayess:path` resolve/relative/isAbsolute, and `jayess:process` argv, but env mutation and subprocess spawning remain intentionally outside the current surface.

Package resolution is also intentionally narrower than full Node/JavaScript compatibility. Jayess accepts transpileable Jayess package entries, but broader conditional `package.json` `exports` behavior is not yet part of the approved next slice.
Packages that expose only unsupported conditional export branches now fail with focused diagnostics rather than being treated like ordinary missing files.

Destructuring now supports nested array/object patterns, defaults, final rest bindings, assignment destructuring into existing identifiers, and destructuring declarations in `for` initializers. The remaining intentional limits are narrower ones such as array elisions, destructured parameters, and arbitrary member targets inside assignment destructuring. See [destructuring-roadmap.md](./destructuring-roadmap.md).
