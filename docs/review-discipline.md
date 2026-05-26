# Review Discipline

This repository treats review discipline as part of contributor workflow, not as optional advice.

## Before A Feature

- identify which pipeline stage is changing before writing code
- prefer the narrowest relevant tests first when that is practical
- keep each patch to one subsystem or one vertical slice

## After A Feature

- run the relevant unit tests for the changed area
- run compile-validation tests after any C++ emission or runtime change
- run fixture-based module graph tests after module-resolution changes
- run escape-analysis regressions after lifetime-related changes

## Patch Scope

- do not mix unrelated parser, semantic, runtime, and output work into one patch unless it is one coherent vertical slice
- when a feature touches multiple stages, keep each stage-specific change small and reviewable

## Current Size Audit

The latest reviewability audit found:

- `src/`: about 26k JavaScript lines. Current refactor candidates are `runtime-http-source.js` at about 1k lines, then `emit-module.js` and `runtime-image-source.js` at about 600 lines each.
- `stdlib/`: about 11k lines. The largest current Jayess module file is `stdlib/jayess/canvas/index.js` at about 800 lines, with focused canvas helpers already split into parser, style, layout, paint, scalar, and state files.
- `test/`: about 25k JavaScript lines. No active test file in the audit was over 1k lines; the largest were output/module metadata and module graph tests.
- `docs/`: about 9k Markdown lines. The largest docs remain overview, standard-library, and system-module indexes.

Current focused extractions already protecting large runtime files:

- HTTP request URL helpers are split into `stdlib/jayess/http/request.js` rather than growing `stdlib/jayess/http/index.js`.
- HTTP request/response/server/config/TLS/body helpers are split from the main HTTP runtime source.
- Wayland registry, input, and software-buffer helpers are split from the main Wayland runtime source.
- Module import collection, module initialization, and top-level declaration emission are split from `emit-module.js`.
- Image file metadata and image file encoders are split from the main image runtime source.
- GPU draw-resource descriptor validation is split from the main GPU runtime source.

Future slices should continue extracting one responsibility at a time before adding unrelated behavior to those parent files.

Runtime test helper changes should follow the same rule. Shared support under `test/support/` may centralize repeated mechanics such as managed temp output, generated entry metadata, compiler execution, and host-unavailable skip messages, but feature assertions should stay in the focused `test/runtime/` file that owns the behavior.
