# Feature Matrix

This is the authoritative quick syntax-support matrix for shipped Jayess language features. `Supported` means the parser, semantic analyzer, and C++ emitter have an implemented path. `Limited` means the feature is implemented for the documented Jayess-owned subset.

| Feature | Status | Notes |
| --- | --- | --- |
| `var` / `const` declarations | Supported | `const` reassignment is rejected semantically. |
| Function declarations and expressions | Supported | Includes defaults, rest parameters, closures, and destructured parameters. |
| Arrow functions | Limited | Lexical `this` is supported; `arguments` is unsupported. |
| Async functions | Limited | Jayess async handles, `await`, and `jayess:async` helpers are supported. JavaScript `Promise` is not a language surface. |
| Generators | Limited | Direct yields, focused control-flow shapes, selected expression-yield positions, generator-local destructuring, and verified try/catch and try/finally resume paths are supported. Unsupported yielding expression/control positions fail semantically before C++ emission. Async generators are unsupported. |
| Classes | Limited | Single Jayess class base, fields, methods, private members, static blocks, inherited public static lookup, construction, computed static `super` forms, first-statement `super(...)` validation in derived constructors, and private static inheritance boundaries are supported. |
| Destructuring | Limited | Nested patterns, elisions, defaults, rest bindings, parameters, `for` initializers, identifier assignment targets, and public member assignment targets are supported. |
| Control flow | Supported | `if`, loops, `switch`, `try`/`catch`/`finally`, `throw`, `break`, and `continue`. |
| Modules | Limited | Relative modules, package imports, export patterns, re-exports, native artifacts, and `cpp:*` includes. Dynamic import is unsupported. |
| Optional chaining | Supported | Property, computed, and call forms. |
| Spread | Limited | Call/new spread, array spread, object spread, and final rest bindings. |
| Built-in JS globals | Unsupported | Use Jayess-owned `jayess:*` modules instead. |

See [semantics.md](./semantics.md), [limitations.md](./limitations.md), and [unsupported-by-design.md](./unsupported-by-design.md) for details.
