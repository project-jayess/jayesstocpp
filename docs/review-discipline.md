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
