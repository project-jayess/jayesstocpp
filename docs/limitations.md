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

Unsupported generator lowering forms, unsupported `super` member forms, unsupported destructuring targets, and unsupported operator shapes should fail during semantic analysis before C++ emission. Current generator limitations include nested function or class declarations inside generator bodies and yield shapes outside the focused lowering paths.
Those permanently unsupported-by-design forms now also fail with focused diagnostics instead of being left to ordinary undefined-name or malformed-import errors.

The current runtime treats `null` as a distinct Jayess value via `std::monostate`. Jayess does not currently aim to add a separate JavaScript-style `undefined` value; `null` is the intended built-in missing-value sentinel. Direct `undefined` usage fails during semantic analysis with `JY_SEMANTIC_UNDEFINED_UNSUPPORTED` instead of falling through as an ordinary missing binding. See [semantics.md](./semantics.md).

Unary operator support is intentionally narrow. `!expr`, `+expr`, and `-expr` are supported, while broader JavaScript-style unary operator coverage is outside the current language surface.

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

Arrow functions are supported for ordinary identifier parameters, destructured parameters, optional defaults, parenthesized rest parameters, expression bodies, and block bodies. The `arguments` object inside arrow functions remains intentionally unsupported; use named parameters or rest parameters instead.

Spread support currently includes call-style argument lists, array literals, and object literals. `fn(...items)`, `callback?.(...items)`, `new Point(...coords)`, `[...items, tail]`, and `{ ...base, answer: 1 }` are supported. Rest parameters are also supported through the callable argument model. The current spread runtime path requires Jayess arrays for call/array spread sources and Jayess objects or callables for object spread sources.

Nullish coalescing is supported through `left ?? right`, and it currently treats only `null` as nullish. Jayess does not model a separate JavaScript-style `undefined` value.

The intended language direction is to keep that model permanent: `null` is the only built-in missing-value sentinel for implicit results and missing lookups as well. The remaining implementation work is to make all runtime paths follow that rule consistently.

Optional chaining is supported for `obj?.prop`, `obj?.[expr]`, and `fn?.(...)`, and it currently short-circuits to Jayess `null`. Broader JavaScript optional-chaining edge cases are still intentionally out of scope.

Ternary expressions are supported through `condition ? whenTrue : whenFalse`.

Switch statements are supported in a narrow first slice. `case` labels must be literal values, `default` may appear once, and Jayess uses explicit non-fallthrough semantics rather than JavaScript-style fallthrough.

Try/catch/finally is supported in a narrow first slice. Catch clauses support only an optional identifier binding, Jayess `throw expr;` lowers through a dedicated runtime exception carrier, and non-Jayess C++ exceptions still arrive as Jayess strings from `what()`. `finally` blocks support `return`, `break`, and `continue` through internal generated control-flow signals, while invalid `break` and `continue` targets still fail during semantic analysis.

`async` / `await` now has a narrow shipped slice. `async function` declarations, async function expressions, async arrow functions, async class methods, and `await expr` inside those async bodies are supported, and they lower to Jayess-owned async handles with explicit runtime completion state. `jayess:async` includes explicit composition helpers plus cooperative scheduler-backed `sleep` and `timeout` helpers. Generated modules expose `jayess_module_init_async()` as a resolved async-handle wrapper around synchronous module initialization. Async constructors and top-level `await` remain unsupported by design.

Generators now have a narrow shipped slice. Generator declarations, generator function expressions, and generator class methods support direct `yield expr` and direct `yield* expr`, including direct yields inside nested blocks, `if` / `else` branches, `while` loops, `for` loops, `do` / `while` loops, and `switch` statements. Focused generator `try/catch` shapes are supported when the `try` block ends with one direct non-delegated `yield` and the catch body does not contain `yield`, or when the `try` block contains multiple direct non-delegated yield statement positions with non-yielding surrounding statements and a non-yielding catch body. A focused catch-body `try/catch` shape is supported when the `try` block contains no `yield` and the catch body contains exactly one direct non-delegated `yield`. A focused generator `try/finally` shape is supported when the `try` block contains one or more direct non-delegated `yield` statements, surrounding `try` statements do not contain `yield`, and the `finally` block does not contain `yield`. Selected expression-yield forms are also supported, including `return yield value`, binary expressions, short-circuit expressions, conditional expressions, call arguments without spread, composite literals without spread, and simple assignment right-hand sides. Unsupported yielding expression/control positions fail during semantic analysis before C++ emission. Generator-local array and object destructuring declarations are also supported. Async generators remain unsupported.

Inheritance now has a narrow shipped slice. Jayess supports one Jayess class base through `extends`, `super(...)` as the first statement inside derived constructors, `super.method(...)` and `super[expr](...)` inside derived instance methods, `super.method(...)` and `super[expr](...)` calls inside derived static methods, static `super.name` and `super[expr]` reads, non-call computed instance `super[expr]` reads, and public static member lookup through the base-class chain. The current unsupported forms are non-class base expressions, broader JavaScript inheritance flexibility, and `super` property assignment forms.

Private members now have a narrow shipped slice. Private instance field declarations, private instance methods, private static fields, private static methods, and private reads/writes/calls are supported when the access occurs inside methods or field initializers of the declaring class. Private static access is class-side and uses hidden class storage instead of public static properties.

Computed class member names and static initialization blocks now have a narrow shipped slice. Computed instance/static methods and fields are supported, and static fields plus static blocks run in one source-ordered class-side sequence. Static blocks keep ordinary class-name access and do not gain a special class-side `this` binding. Richer class-side semantics and broader JavaScript class edge cases remain unsupported.

Large JavaScript runtime built-ins are intentionally not exposed as ambient globals. Jayess now ships narrow module-owned slices for `jayess:date`, `jayess:json`, `jayess:collections/map`, and `jayess:collections/set`, but it still does not provide ambient `Date`, `Map`, `Set`, or `JSON` objects.

Jayess also does not adopt JavaScript `Promise` as part of the language/runtime surface. `async` / `await` is supported through Jayess-owned async handles and Jayess-owned async composition APIs instead.

These larger remaining features should not automatically be assumed to require large hardcoded C++ runtime implementations. The preferred direction is a small primitive runtime plus Jayess-written standard-library/core modules where practical.

Ambient Node built-ins are not available inside Jayess source imports. Imports such as `node:fs` and `node:path` fail with explicit diagnostics rather than flowing through ordinary package resolution. A narrow first Jayess-owned system-module slice now exists through `jayess:fs`, `jayess:path`, and `jayess:process`, but broader Node-compatible host APIs are still intentionally out of scope.
That shipped slice now includes `jayess:fs` remove/list/rename/stat, `jayess:path` resolve/relative/isAbsolute, `jayess:process` argv, and the explicit `jayess:subprocess` process-execution module. Env mutation remains outside the current surface.

`jayess:net` is a Jayess-owned TCP module rather than Node `net` compatibility. Its current implemented host adapters cover POSIX sockets and a guarded Windows Winsock path while keeping platform-specific operations behind the runtime adapter boundary.

Package resolution is also intentionally narrower than full Node/JavaScript compatibility. Jayess accepts transpileable Jayess package entries, root and explicit subpath `exports`, and focused conditional package export branches selected in `jayess`, `import`, then `default` order.
Packages that expose only unsupported conditional export branches still fail with focused diagnostics rather than being treated like ordinary missing files.

Destructuring now supports nested array/object patterns, array elisions, defaults, final rest bindings, assignment destructuring into existing identifiers and public member targets, destructuring declarations in `for` initializers, and destructured parameters for functions, arrows, methods, and constructors. Private member targets and other arbitrary assignment-only JavaScript targets remain outside the current destructuring slice.
