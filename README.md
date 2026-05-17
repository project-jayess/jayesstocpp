# jayesstocpp

Jayess is a JavaScript-like native programming language that transpiles to C++.

The intended architecture is:

- a **small C++ runtime** for primitive machinery Jayess cannot express yet
- a **Jayess-written standard library and higher-level core modules** where practical
- user Jayess code transpiled together with those modules into the final C++ project

That means future standard-library and core-language support does not have to be hardcoded entirely in C++. When a feature can be expressed safely in Jayess, the preferred direction is to implement it in Jayess source and let `transpileFile()` bring it into the generated output through normal module resolution.

The preferred future built-in-module direction is a reserved Jayess-owned namespace such as `jayess:*`, distinct from both `node:*` and `cpp:*`.

Current implemented slice:

- synchronous `transpile(source, options?)`
- synchronous `transpileFile(entryFilename, targetDirname, options?)`
- block-scoped `var`
- `const` declarations
- function declarations
- `return`
- `if` / `else`
- arithmetic and comparison expressions
- relative Jayess module imports
- extensionless relative imports
- bare and scoped package imports resolved from `node_modules`
- native header passthrough imports
- native source side-effect imports
- `cpp:<header>` imports for C++ standard library headers

See [docs/overview.md](docs/overview.md), [docs/stdlib-and-core-model.md](docs/stdlib-and-core-model.md), [docs/testing.md](docs/testing.md), [docs/shared-library.md](docs/shared-library.md), [docs/limitations.md](docs/limitations.md), [docs/workflow.md](docs/workflow.md), and [docs/review-discipline.md](docs/review-discipline.md).
