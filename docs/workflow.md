# Developer Workflow

This repository keeps development workflow decisions narrow and explicit.

## Test Layers

- `npm test` runs the full suite.
- `npm run test:unit` runs the fast parser, semantic, module, output, and API tests.
- `npm run test:compile` runs compile-validation tests separately.
- `npm run test:update-snapshots` refreshes focused emitted-C++ snapshots intentionally.

## Temporary Output

- compile-validation output lives under `./temp/test-output`
- test helpers register cleanup for only the directories they create
- cleanup checks that a path stays under `./temp/test-output` before removing it

## Scratch Space

- if local agent scratch files are needed, keep them under `./dev-agent`
- do not mix scratch files into `src`, `test`, or generated output directories

## CI

- GitHub Actions runs the fast unit suite and compile-validation suite separately
- the workflow installs `clang` so compiler-validation stays active instead of silently skipping

## Review Discipline

- follow [docs/review-discipline.md](review-discipline.md) before opening or merging a patch
- use it to decide stage ownership, required test scope, and whether a change is still a focused vertical slice

## Diagnostics

- follow [docs/diagnostics.md](diagnostics.md) when changing parser, semantic, module, or backend diagnostics
- treat diagnostic wording as a tested contributor-facing contract
