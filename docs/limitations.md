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

## Larger Language Gaps

Still out of scope in the current implementation:

- broad JavaScript compatibility

Unsupported forms currently fail explicitly for:

- `let`
- binding imports from `cpp:<header>` dependencies
- binding imports from native source or native library artifacts
- tagged template literals

The current runtime treats `null` as a distinct Jayess value via `std::monostate`, but it does not yet implement wider JavaScript-style `null` / `undefined` behavior. This is partly unsupported surface area and partly an intentionally different semantic model; see [semantics.md](./semantics.md).

Unary operator support is still intentionally narrow. `!expr` and `-expr` are supported, but broader JavaScript-style unary operator coverage is not yet implemented.

Logical operator support is currently limited to `&&` and `||`. Broader JavaScript operator coverage is still intentionally incomplete.

Strict equality support currently lowers `===` and `!==` through the same exact-type runtime comparison path used by `==` and `!=`. This is intentionally different from JavaScript, which applies different coercion rules for `==`.

Arithmetic operator coverage is still intentionally incomplete. `%` is supported for numeric values, but broader JavaScript numeric edge-case behavior is not fully modeled. Numeric operators also intentionally assume numeric operands rather than performing JavaScript-style coercion.

Exponentiation is supported through `**`, including right-associative chaining, but the transpiler does not currently model every JavaScript-specific parsing edge case around unary operators and exponentiation.

Unary plus is supported as a numeric identity operation. It is intentionally different from JavaScript-style coercion semantics.

Template literals are supported with backtick-delimited `${expr}` interpolation. Ordinary quoted strings do not interpolate `{name}` text, and tagged templates are still intentionally unsupported.

Default parameters are supported for functions, closures, methods, and constructors. They apply only when an argument is omitted; passing explicit `null` does not trigger the default initializer.

Trailing commas are supported in parameter lists, argument lists, array literals, object literals, import lists, and export lists. Broader JavaScript comma-expression behavior is still intentionally unsupported.

Compound assignment is supported for mutable locals plus property/index targets through `+=`, `-=`, `*=`, `/=`, `%=`, and `**=`.

Prefix and postfix update expressions are supported for mutable locals plus property/index targets through `++` and `--`. Broader JavaScript update semantics beyond those operators remain intentionally narrower than full JavaScript behavior.

Composite built-in coverage is still intentionally small. Arrays and strings support `.length`, arrays support `.push(...)`, `.pop()`, and `.join(...)`, and strings support `.slice(...)`, `.substring(...)`, and `.startsWith(...)`, but broader `Array.prototype` and `String.prototype` method/property coverage is still unsupported.

String/number built-in coverage is also intentionally narrow. Primitive `.toString()` is supported for strings, numbers, booleans, and null, but `parseInt`, `parseFloat`, and broader JavaScript standard-library emulation are still unsupported in the current implementation.

Arrow functions are supported for ordinary identifier parameters with optional defaults, parenthesized rest parameters, expression bodies, and block bodies. Destructured parameters and `arguments` inside arrow functions are still intentionally unsupported.

Spread support currently includes call-style argument lists, array literals, and object literals. `fn(...items)`, `callback?.(...items)`, `new Point(...coords)`, `[...items, tail]`, and `{ ...base, answer: 1 }` are supported. Rest parameters are also supported through the callable argument model. The current spread runtime path requires Jayess arrays for call/array spread sources and Jayess objects or callables for object spread sources.

Nullish coalescing is supported through `left ?? right`, and it currently treats only `null` as nullish. Jayess does not yet model a separate JavaScript-style `undefined` value.

Optional chaining is supported for `obj?.prop`, `obj?.[expr]`, and `fn?.(...)`, and it currently short-circuits to Jayess `null`. Broader JavaScript optional-chaining edge cases are still intentionally out of scope.

Ternary expressions are supported through `condition ? whenTrue : whenFalse`.

Switch statements are supported in a narrow first slice. `case` labels must be literal values, `default` may appear once, and Jayess uses explicit non-fallthrough semantics rather than JavaScript-style fallthrough.

Try/catch/finally is supported in a narrow first slice. Catch clauses support only an optional identifier binding, Jayess `throw expr;` lowers through a dedicated runtime exception carrier, and non-Jayess C++ exceptions still arrive as Jayess strings from `what()`. `finally` blocks also intentionally reject `return`, `break`, and `continue` in this slice so cleanup can lower through a focused RAII guard without changing surrounding control flow.

`async` / `await` now has a narrow first shipped slice. `async function` declarations and `await expr` inside async function bodies are supported, and async functions lower to Jayess-owned async handles with explicit runtime completion state. Async function expressions, async arrow functions, async methods/constructors, and top-level `await` are still outside the current slice.

Generators now have a narrow first shipped slice. Generator declarations support direct `yield expr` and direct `yield* expr`, and generator declarations lower through Jayess-owned generator handles plus explicit state-slot resume lambdas. Generator function expressions, generator methods, async generators, and more complex yield nesting are still outside the current slice.

Inheritance now has a narrow first shipped slice. Jayess supports one Jayess class base through `extends`, `super(...)` inside derived constructors, and `super.method(...)` inside derived instance methods. The current slice still excludes static inheritance, `super` property assignment forms, computed `super[expr]`, non-class base expressions, and broader JavaScript inheritance flexibility.

Private members now have a narrow first shipped slice. Private instance field declarations and private reads/writes are supported when the access occurs inside methods or field initializers of the declaring class. Private methods, private static fields, private static methods, and broader private-member forms are still intentionally outside the current slice.

Computed class member names and static initialization blocks now have a narrow first shipped slice. Computed instance/static methods and fields are supported, and static fields plus static blocks run in one source-ordered class-side sequence. Static inheritance, richer class-side semantics, and broader JavaScript class edge cases are still intentionally outside the current slice.

Large JavaScript runtime built-ins are also not implemented yet as Jayess-provided modules. Jayess does not currently provide ambient `Date`, `Promise`, `Map`, `Set`, or `JSON` objects, and those features will land through explicit Jayess library/runtime slices rather than ambient globals.

These larger remaining features should not automatically be assumed to require large hardcoded C++ runtime implementations. The preferred direction is a small primitive runtime plus Jayess-written standard-library/core modules where practical.

Ambient Node built-ins are not available inside Jayess source imports. Imports such as `node:fs` and `node:path` fail with explicit diagnostics rather than flowing through ordinary package resolution. A narrow first Jayess-owned system-module slice now exists through `jayess:fs`, `jayess:path`, and `jayess:process`, but broader Node-compatible host APIs are still intentionally out of scope.

Declaration destructuring is currently limited to simple `var`/`const` bindings with flat array and object patterns, including final rest bindings like `[head, ...tail]` and `{ name, ...rest }`. Nested patterns, default values inside patterns, assignment-pattern destructuring, and destructuring in `for` initializers are still intentionally unsupported.
