# Diagnostics Expectations

This repository treats diagnostics as part of the transpiler contract, not incidental error text.

## Current Friction Areas

The highest-friction diagnostics for contributors have been:

- malformed import/export syntax that failed with generic `Expected ...` messages
- valid-looking operators used on unsupported targets, such as `++(a + 1)` or `(a + 1) += 2`
- package imports that failed without distinguishing:
  - package missing from `node_modules`
  - package subpath missing
  - package export target missing on disk
  - package present but without a transpileable entry file

## Repository Expectations

- syntax diagnostics should say which declaration or form is malformed when practical
- unsupported-feature diagnostics should say that Jayess does not support the form, rather than only saying `Expected ...`
- semantic diagnostics should explain the operation that is unsupported, not only the node kind
- module-resolution diagnostics should distinguish missing packages from unusable package entries when practical
- diagnostics should include `filename`, `line`, and `column` whenever the failing source location is known
- file-level module diagnostics may omit `line` and `column` when only a resolved path is known

## Message Style

- prefer direct statements such as `Malformed import declaration: expected 'from' before the source string`
- prefer `Jayess syntax does not support ...` or `Jayess semantic analysis does not support ...` for unsupported forms
- include the relevant operator, import source, package name, or related path when it materially improves debugging
- avoid replacing structured diagnostics with generic thrown `Error` messages

## Contributor Guidance

- if you add a new unsupported form, give it a focused, user-facing diagnostic
- if a parser or semantic rule has a custom diagnostic, add a regression test for the wording
- if a module-resolution path gains a new failure mode, add a fixture and test that prove the diagnostic stays specific
