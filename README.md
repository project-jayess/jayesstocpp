# jayesstocpp

Jayess is a JavaScript-like native programming language that transpiles to C++.


The separate public CLI project can be used as:

```
npx tocpp@latest <entry-file> [output-dir]
```
Options:
- -o, --out <dir>: write generated C++ output to a directory
- --project-kind executable|shared-library: choose the generated project kind
- --library-name <name>: set the shared library name
- --runtime-fragments auto|all: choose runtime fragment emission mode

This `jayesstocpp` package itself does not export a public CLI or npm `bin`. Its public surface is the JavaScript API. The repository contains `tools/transpile-file.js` only as a developer-only internal helper for testing `transpileFile()` from a checkout:

```powershell
node tools/transpile-file.js custom-test/simple-io/src/simple-io.js custom-test/simple-io/cpp
```

For executable output, a top-level Jayess `function main()` in the entry file is the native program starting point. `transpileFile()` emits `executable/jayess_main.cpp`, calls the generated module initializer, calls the generated Jayess `main()`, and maps a numeric return value to the process exit code.

Jayess is compiled, not interpreted. It aims to feel familiar to JavaScript developers without inheriting every highly dynamic JavaScript runtime feature.

The intended architecture is:

- a **small C++ runtime** for primitive machinery Jayess cannot express yet
- a **Jayess-written standard library and higher-level core modules** where practical
- user Jayess code transpiled together with those modules into the final C++ project

That means future standard-library and core-language support does not have to be hardcoded entirely in C++. When a feature can be expressed safely in Jayess, the preferred direction is to implement it in Jayess source and let `transpileFile()` bring only the reachable pieces into the generated output through normal module resolution.

Named import lists must drive generated output at export/declaration granularity once the reachable-symbol emission slice is implemented. For example, importing `{ readTextSync, writeTextSync }` from `jayess:fs` should emit only those functions, their local helpers, the imports used by that reachable code, their native bridge calls/artifacts, and their required runtime fragments. Other import forms, including default imports such as `import express from "express";`, namespace imports, and side-effect imports, should retain the whole resolved module for now. Whole-module emission must be recorded in generated metadata so broad output remains explainable.

The preferred future built-in-module direction is a reserved Jayess-owned namespace such as `jayess:*`, distinct from both `node:*` and `cpp:*`.

Jayess also targets cross-platform native rendering through Jayess-owned standard-library modules. The planned rendering family is:

- `jayess:color` for color values, parsing, conversion, and blending
- `jayess:image` for pixel buffers and image file output
- `jayess:canvas` for off-screen 2D drawing over image buffers and the Jayess-owned HTML/CSS render engine
- `jayess:gui` for interactive application/window state over canvas-rendered surfaces
- `jayess:window` for live native windows, frame presentation, and input events
- `jayess:gpu` for optional GPU-accelerated resources, pipelines, and draw commands

The current canvas implementation renders into an off-screen software image buffer and can save deterministic image files. Jayess ships an original license-safe default 5x7 bitmap font through `jayess:font`, and canvas text plus the focused HTML/CSS renderer can select registered bitmap fonts, file-backed TTF/TrueType-style OTF/WOFF/WOFF2 font handles, or registered system default font handles with `font` / `fontFamily` options and CSS `font-family`. System font discovery probes common host font paths at runtime and falls back to `jayess-default-5x7` when unavailable. File-backed fonts currently provide deterministic metrics and registry selection while real outline rasterization remains tracked implementation work. The canvas HTML/CSS renderer now supports deterministic percentage sizing for the native-canvas path, including `width: 100%` and `height: 100%` against definite containing bounds. The intended GUI direction is a Jayess-owned cross-platform toolkit: portable CPU rendering first, live native window support second, and optional GPU acceleration third. HTML/CSS support belongs in `jayess:canvas` as a focused renderer over canvas/image/font/layout primitives; `jayess:gui` should consume that renderer for interactive state, window events, invalidation, and presentation. GPU support should expose a Jayess-owned API while using focused backend adapters for platform graphics APIs such as Direct3D, Metal, Vulkan, or OpenGL where appropriate, rather than copying a broad third-party GUI, browser, or graphics toolkit into the repository.

Database support is intentionally not shipped for now. There is no `jayess:db`, `jayess:sqlite`, bundled SQLite adapter, or repository-owned database runtime in the current standard-library surface.

Language-policy note:

- Jayess `var` already fills the block-scoped mutable-binding role, so `let` is not part of the language.
- Jayess does not support dynamic `import()`, `eval(...)`, `Function(...)`, or `with`.
- Jayess uses closed compile-time module resolution rather than runtime source loading/evaluation.

See [Jayess.md](./Jayess.md) for the current language-direction rules and explicit non-goals.

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

Manual feature probes live under `custom-test/`. These are separated from the automated `test/` suite and are intended for hands-on Jayess programs that exercise a language feature end to end.

Recommended layout for each probe:

```text
custom-test/<feature>/src/   # Jayess source files
custom-test/<feature>/cpp/   # transpileFile output
custom-test/<feature>/dist/  # locally compiled binaries or run artifacts
```

For example, console manual testing can use `custom-test/console/src/console.js`, transpile into `custom-test/console/cpp/`, and compile/run from `custom-test/console/dist/`. Keep generated `cpp/` and `dist/` outputs out of commits unless a task explicitly asks for checked-in artifacts.

See [Jayess.md](./Jayess.md), [docs/overview.md](docs/overview.md), [docs/stdlib-and-core-model.md](docs/stdlib-and-core-model.md), [docs/reachable-symbol-emission.md](docs/reachable-symbol-emission.md), [docs/internal-tools.md](docs/internal-tools.md), [docs/jayess-native-gui.md](docs/jayess-native-gui.md), [docs/testing.md](docs/testing.md), [docs/shared-library.md](docs/shared-library.md), [docs/limitations.md](docs/limitations.md), [docs/workflow.md](docs/workflow.md), and [docs/review-discipline.md](docs/review-discipline.md).
