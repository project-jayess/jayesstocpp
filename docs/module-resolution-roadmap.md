# Module And Export Semantics Roadmap

This document records the current Jayess direction for module/export hardening work beyond the already shipped import/export surface.

## Current Shipped Rule

Today Jayess supports:

- named exports
- default exports
- named re-exports
- `export * from "./mod.js"` for named bindings only
- default imports
- namespace imports

The current shipped behavior is intentionally narrower than full JavaScript module compatibility.

## `export *` And Default Exports

Current and approved direction:

- `export *` continues to exclude default exports permanently
- Jayess does not add a special forwarding rule where `export *` synthesizes or forwards `default`
- forwarding default exports must stay explicit through:
  - `export { default } from "./mod.js";`
  - `export { default as name } from "./mod.js";`

Reason:

- this keeps export surfaces explicit
- this avoids JavaScript ecosystem ambiguity around star re-exports and default forwarding
- it keeps generated alias/header behavior deterministic

Current hardening behavior:

- mixed graphs that combine explicit named re-exports and `export *` are supported
- importing `default` through an `export *`-only bridge is rejected explicitly
- duplicate exported names in one Jayess module are rejected explicitly

## Package `exports` Support

Current and approved direction:

- the current package-entry support is intentionally narrow
- Jayess should continue to support direct transpileable entry discovery through the current `package.json` handling
- broader conditional export-branch resolution is not part of the next hardening slice

That means the next slice does **not** try to emulate the full Node package-exports algorithm.

Still unapproved for the next slice:

- condition-name branching such as environment-specific export maps
- large compatibility surfaces for packages that are primarily JavaScript-runtime packages rather than Jayess source packages
- broad fallback chains across many conditional branches

## Async Initialization And Module Cycles

Top-level `await` is still unsupported today.

Current approved direction:

- module cycles do not currently interact with async initialization because Jayess has no shipped top-level `await`
- if top-level `await` is ever approved later, async module initialization ordering must become a separate milestone with its own cycle rules
- section 104 should record that dependency, not invent partial async-cycle semantics early

## Invalid Jayess Packages Versus Invalid JavaScript Packages

Current approved direction:

- diagnostics should distinguish:
  - missing packages
  - installed packages with no transpileable Jayess entry
  - installed packages whose entry exists but is not a supported Jayess source artifact
  - installed JavaScript-oriented packages that are present in `node_modules` but are not valid Jayess packages

The next hardening work should improve diagnostics in that direction without broadening what counts as a valid Jayess package.

Current hardening behavior:

- packages that expose only unsupported conditional export branches now fail with an explicit diagnostic instead of silently looking like an ordinary missing file
- packages that resolve to unsupported artifact types still fail with explicit unsupported-file-type diagnostics
