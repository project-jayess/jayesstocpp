# Testing Workflow

The repository uses Node's built-in test runner.

## Commands

```bash
npm test
npm run test:unit
npm run test:compile
npm run test:update-snapshots
```

## What The Tests Cover

- public API export shape
- source location mapping
- lexer behavior
- parser behavior
- semantic diagnostics
- escape analysis
- module graph resolution including `node_modules`
- `transpileFile()` output writing
- focused `transpileFile()` runtime fragment, builtin module, and module metadata output
- native header and native source artifact copying
- native library artifact copying
- emitted C++ snapshot stability
- compiler validation with `clang++`, `c++`, or `g++`
- generated-C++ executable runtime validation for selected stdlib and language behavior
- shared-library-oriented generated project layout

## Test Organization

Large test files are split by feature area:

- semantic coverage is grouped by broad semantic behavior, builtins, classes, control flow, destructuring, and diagnostics
- `transpile()` API coverage keeps string-mode API errors separate from generated-output shape assertions
- parser coverage is grouped by control flow, async/generators, classes, destructuring, and expressions
- `transpileFile()` output coverage is grouped by runtime fragments, builtin module families, and project metadata
- compiler coverage is grouped by expression/control-flow, destructuring/spread, functions, and project/module builds
- runtime source assertions are grouped by core value helpers, collection/text primitives, system/thread/time primitives, and executable runtime tests

## Compiler Validation

Compiler validation is intentionally narrow:

- compile-validation output is written under `./temp/test-output`
- runtime support header and implementation are written next to it
- the first available compiler from `clang++`, `c++`, or `g++` is used for focused compile checks
- `transpileFile()` output is compiled translation-unit by translation-unit
- compile-validation tests are skipped intentionally when no supported compiler is installed

Compiler diagnostics are a debugging signal for the transpiler. They are not treated as a replacement for parser, semantic, or emitter correctness.

## Executable Runtime Validation

Executable runtime validation is a separate test layer under `test/runtime/`.

- it transpiles one focused fixture into `./temp/test-output`
- compiles the generated project plus one tiny C++ `main`
- runs the executable and checks the returned `jayess::value` behavior
- it is intentionally selective and does not try to execute every compile-validated project

Use compile-validation to prove generated C++ shape and buildability. Use executable runtime validation to prove selected shipped runtime behavior after real execution.

## Snapshot Workflow

- emitted `transpile(source)` output has focused snapshots under `test/snapshots`
- update snapshots intentionally with `npm run test:update-snapshots`
- snapshot tests are meant to catch backend drift, not replace compile-validation

## Temp Output Policy

- contributor-facing tests keep generated build artifacts under `./temp/test-output`
- this is intentional repository policy, even though some projects prefer temp output outside the source tree
- test cleanup removes only directories created under that root
- transpiler tests do not delete arbitrary user paths
