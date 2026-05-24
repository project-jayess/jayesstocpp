# Runtime Verification

Executable runtime tests live under `test/runtime/`.

These tests transpile focused Jayess fixtures into a managed project directory under `temp/test-output/`, compile the generated C++ with a tiny C++ `main`, and run the executable. The harness is intentionally small: each test calls a real exported Jayess function and checks the returned `jayess::value` shape from C++.

## Approved Scope

The first approved executable-runtime verification scope is:

- focused exported Jayess entry points only
- generated projects written under `temp/test-output/`
- one tiny generated C++ `main` per test case
- one small fixture or module family per test file
- local compiler discovery through the existing compiler helper
- explicit separation from compile-only validation under `test/cpp/`

This scope is intentionally narrower than full application-level end-to-end testing. It exists to prove real generated-runtime behavior for selected shipped language, stdlib, and host-module surfaces without replacing the compile-validation suite.

## Harness

The current executable-runtime harness lives under `test/support/`:

- `generated-executable.js` transpiles one fixture into a managed temp project and derives the generated module header/namespace
- `compiler.js` discovers a local C++ compiler, writes the runtime support files, compiles the generated project plus one tiny `main`, and runs the executable

Executable runtime tests themselves live under `test/runtime/` and should keep using this harness instead of introducing parallel ad hoc runners.

## Fixture Discipline

Runtime-verification fixtures under `test/fixtures/runtime/` must stay small and purpose-built:

- one narrow runtime behavior per fixture when practical
- one compact user flow per workflow fixture
- no giant catch-all integration project reused across unrelated runtime assertions
- prefer adding one new focused fixture over widening an old one with unrelated behavior

Existing workflow fixtures are allowed to combine a few cooperating modules, but they should still model one compact flow and remain easy to review.

## Compile Validation vs Executable Runtime

The repository keeps two separate native-backend test layers:

- `test/cpp/` compile-validation checks that generated C++ builds successfully for a focused source/module shape
- `test/runtime/` executable-runtime checks that selected generated programs actually run and produce the expected `jayess::value` behavior

Compile-validation proves:

- emitted translation units are syntactically and structurally valid C++
- generated project layouts and runtime fragments compile together
- selected builtin and module graphs lower cleanly to native code

Executable-runtime verification proves:

- selected shipped language/runtime surfaces behave correctly after generation and compilation
- async rejection, generator failure, native exception bridging, and host-module behavior survive real execution
- focused stdlib and host-module helpers work through the generated runtime, not only through emitted shape checks

Not every compile-validated surface is executable-runtime verified yet. The executable layer is intentionally selective and should expand through small focused slices instead of trying to run every generated project.

The covered surfaces include:

- broad language/runtime executable checks for arithmetic, closures, classes, async handles, generators, and lifetime-sensitive behavior
- `jayess:fs` async defaults
- `jayess:fs` `Sync` helpers
- `jayess:path` resolution helpers
- `jayess:process` argv/cwd/env inspection
- `jayess:bytes` with `jayess:encoding`, including `secureEquals(...)` shared-prefix comparison behavior
- `jayess:events`
- `jayess:stream` read/write/copy/text/tee/pipeAll/collect helpers
- `jayess:timers` sleep and timeout helpers
- `jayess:date` timestamp conversion, ISO formatting/parsing, and millisecond arithmetic helpers
- `jayess:json` parse/stringify/pretty/validate helpers
- `jayess:thread` spawn/join helpers
- `jayess:regex` match, split, match-all, and replacement helpers
- `jayess:collections/map` key/value storage, entry materialization, and bulk helper behavior
- `jayess:collections/set` membership, entry materialization, and union/intersection/difference helpers
- `jayess:async` completion/failure composition, cancellation tokens, delay/retry helpers, and timeout/cancellation composition
- exception bridging for direct Jayess throws, direct native failures, and native failures bridged back through async rejection payloads
- `jayess:channel` queue-style communication helpers
- `jayess:workqueue` worker helper layer
- `jayess:subprocess` result helpers, output stream helpers, convenience runners, and pipeline helpers
- `jayess:net` loopback exchange and host-adapter diagnostics
- `jayess:http` request/response exchange, real chunked response streaming, malformed and oversized request rejection, explicit idle/header/body read timeout behavior, request/response body size guardrails, multi-request server lifecycle, close diagnostics, route params, and static file serving through the current Unix/POSIX and Windows/Winsock server paths; focused graceful-shutdown and concurrent-request lifecycle probes currently run on Unix-like hosts, while the broader request/response, limits, timeout, streaming, and static-serving parity probes run on both Unix/POSIX and Windows/Winsock hosts
- `jayess:image` deterministic PPM/PGM/BMP/TGA round-trips, bytes encode/decode helpers, crop/resize/rotate/flip behavior, clipped blit behavior, transparent blit edge cases, and pixel-buffer helpers
- `jayess:canvas` software drawing and deterministic text helpers, including executable golden-image verification for clipping, overlap ordering, source-over alpha blending, curves, polygons, and text-box layout
- `jayess:gui` first-toolkit layout, hover/click dispatch, explicit action draining, explicit invalidation, and redraw-flag clearing through the software canvas path
- `jayess:window` normalized unavailable diagnostics, platform-neutral event/lifecycle behavior, the shared `requestFrame` / `cancelFrame` helper layer over `jayess:timers`, host-conditional Win32 and Linux/X11 runtime probes for real lifecycle, presentation, resize, keyboard, and mouse event normalization, a host-conditional Cocoa runtime probe for lifecycle/title/present/poll behavior, and a host-conditional Wayland runtime probe for lifecycle plus software-buffer presentation
- `jayess:dialog` invalid-option diagnostics on every host, deterministic Win32 and Cocoa result normalization/cancellation verification through the focused adapter test hook path, and Linux portal-family normalization/unavailable verification through the same focused runtime probe
- `jayess:gpu` validation-backend command execution, runtime handle behavior, narrow image-to-texture upload behavior, backend-unavailable diagnostics, and focused Win32/Cocoa host-backed clear/draw/present verification when those host adapters and local executable-test toolchains are available
- `jayess:crypto` digest correctness for SHA-256, SHA-512, and legacy SHA-1, HMAC correctness, HKDF-SHA-256 correctness, PEM certificate/private-key/trust-anchor container normalization, streaming-hash correctness, random-byte length, and focused random variability checks
- higher-level module families such as config, cookie, compress, html, kv, validate, terminal, web-data helpers, and text-file helpers
- workflow fixtures that combine CLI parsing, config loading, filesystem output, HTTP JSON/static serving, subprocess pipelines, stream reads, glob scanning, hashing, and async subprocess cancellation helpers
- high-level stdlib helpers layered over existing modules
- generator iteration, completion, and failure propagation behavior
- class inheritance with `super`

Network and window runtime tests accept focused host-adapter unavailable diagnostics as clean local skips so unsupported local hosts do not look like compiler or runtime regressions.

GPU host-backed runtime probes follow the same rule and may also skip for a host-specific local executable-test toolchain when that toolchain is not stable for the selected backend family. Those skips should stay explicit and narrow rather than surfacing as raw process-abort failures.

Workflow fixtures are kept in `test/fixtures/runtime/` and should model compact user flows rather than exhaustive API matrices:

- `workflow-cli-config-main.js` parses CLI-style arguments, loads JSON config, writes output, and reads it back.
- `workflow-http-main.js` serves a JSON route and a static file through `jayess:http`.
- `workflow-subprocess-pipeline-main.js` transforms text through `jayess:subprocess` and reads the result through `jayess:stream`.
- `workflow-fs-glob-hash-main.js` scans a directory with `jayess:glob` and hashes matching files.
- `workflow-async-cancellation-main.js` verifies async subprocess helpers that accept cancellation and timeout primitives.

Focused module fixtures under `test/fixtures/modules/` back the executable checks for shipped stdlib and system-module behavior. They are intentionally small and should stay narrowly aligned with one module family or one integration shape at a time.

The feature/docs consistency audit did not identify a shipped module family that lacked all focused test coverage. Remaining work in the active checklist is deeper executable-runtime verification, not backfilling a completely uncovered shipped surface.

Do not add GitHub workflow coverage for these tests. They are local executable validation tests and use the same compiler discovery policy as existing compile-validation tests.
