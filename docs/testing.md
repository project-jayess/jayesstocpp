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
- native header and native source artifact copying
- native library artifact copying
- emitted C++ snapshot stability
- compiler validation with `clang++`, `c++`, or `g++`
- shared-library-oriented generated project layout

## Compiler Validation

Compiler validation is intentionally narrow:

- compile-validation output is written under `./temp/test-output`
- runtime support header and implementation are written next to it
- the first available compiler from `clang++`, `c++`, or `g++` is used for focused compile checks
- `transpileFile()` output is compiled translation-unit by translation-unit
- compile-validation tests are skipped intentionally when no supported compiler is installed

Compiler diagnostics are a debugging signal for the transpiler. They are not treated as a replacement for parser, semantic, or emitter correctness.

## Snapshot Workflow

- emitted `transpile(source)` output has focused snapshots under `test/snapshots`
- update snapshots intentionally with `npm run test:update-snapshots`
- snapshot tests are meant to catch backend drift, not replace compile-validation

## Temp Output Policy

- contributor-facing tests keep generated build artifacts under `./temp/test-output`
- this is intentional repository policy, even though some projects prefer temp output outside the source tree
- test cleanup removes only directories created under that root
- transpiler tests do not delete arbitrary user paths
