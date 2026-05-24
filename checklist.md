# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler.

Completed milestones through section 309 were moved to [archived-checklist.md](./archived-checklist.md) to keep the working checklist small and focused.

## Active Buildout Rule

The active checklist tracks implementation progress only.

The language boundaries are defined by [Jayess.md](./Jayess.md) and [Agents.md](./Agents.md).

Each active slice should:

- implement one narrow user-visible feature surface
- add only the parser, semantic, runtime, module, lowering, and docs work that the feature actually needs
- keep source files and tests small and focused
- place tests under `test/`
- place documentation under `docs/`
- keep diagnostics aligned with `Jayess.md` and `Agents.md`

## Active Items

## 310. Executable Runtime Verification

- [x] Define the first approved executable-runtime verification scope and keep it separate from pure compile-validation.
- [x] Add a focused runtime-execution test harness under `test/` that compiles generated output and executes selected exported entry points.
- [x] Add runtime-execution verification for async completion ordering and failure propagation.
- [x] Add runtime-execution verification for generator iteration behavior and completion/failure behavior.
- [x] Add runtime-execution verification for regex helper behavior, especially match and replacement edge cases.
- [x] Add runtime-execution verification for filesystem/path/process host-module behavior through controlled temp fixtures.
- [x] Add runtime-execution verification for map/set identity and iteration/data helper behavior.
- [x] Add runtime-execution verification for exception bridging from Jayess-thrown values and native `std::exception` failures.
- [x] Keep runtime-verification fixtures small and purpose-built instead of reusing one giant integration project.
- [x] Update docs to explain which behavior is compile-validated only and which behavior is executable-runtime verified.

## 311. Standard Library Behavioral Hardening

- [x] Audit `jayess:array` exports for argument-count validation, null handling, empty-input behavior, and callback failure propagation.
- [x] Audit `jayess:string` exports for argument-count validation, empty-string behavior, and non-coercive semantics.
- [x] Audit `jayess:object` helpers for null/composite handling, ordering guarantees, and invalid-input diagnostics.
- [x] Audit `jayess:number` helpers for parsing edge cases, invalid-input behavior, and exact return-value semantics.
- [x] Audit `jayess:regex` helpers for invalid-pattern handling, no-match behavior, and callback-free replacement semantics.
- [x] Audit `jayess:url` helpers for invalid-input behavior, normalization rules, and result-shape guarantees.
- [x] Audit `jayess:bytes` and `jayess:buffer` helpers for bounds checks, mutation semantics, and invalid-input diagnostics.
- [x] Audit `jayess:iter` helpers for completion behavior, callback semantics, and generator failure propagation.
- [x] Audit `jayess:time` helpers for unit semantics, monotonic behavior, and duration-formatting guarantees.
- [x] Add focused runtime and API tests for each audited module family instead of broad umbrella tests.
- [x] Update each affected `docs/jayess-*.md` file so per-export behavior and edge cases are explicit.

## 312. Module And Package Ecosystem Polish

- [x] Audit package-import resolution behavior for root exports, explicit subpath exports, and Jayess-specific package conditions.
- [x] Add focused fixture coverage for workspaces/monorepo-style local package layouts if the current resolver claims to support them.
- [x] Tighten diagnostics for invalid Jayess packages versus ordinary installed JavaScript packages that are not transpileable.
- [x] Tighten diagnostics for unsupported package export maps and unsupported file-type targets.
- [x] Audit built-in-module resolution so every documented `jayess:*` module is recognized consistently by `transpileFile()`.
- [x] Audit `transpile()` string-mode diagnostics so built-in-module imports fail consistently with explicit resolver guidance.
- [x] Add fixture coverage for native header/source/library import packaging into the generated target directory.
- [x] Verify target-directory layout stability for package modules, scoped packages, and copied native artifacts.
- [x] Update package-resolution and generated-layout docs after the resolver and packaging behavior are locked.

## 313. Host And System Module Expansion

- [x] Define the next approved `jayess:fs` helper family explicitly instead of broad “more fs”.
- [x] Define the next approved `jayess:path` helper family explicitly instead of broad “more path”.
- [x] Define the next approved `jayess:process` helper family explicitly, keeping env mutation and subprocess policy separate.
- [x] Define whether `jayess:os`, `jayess:url`, `jayess:timers`, `jayess:thread`, or `jayess:subprocess` is the next active host-module slice.
- [x] Add only the minimal native adapter primitives needed for the approved next host-module slice.
- [x] Implement the approved next Jayess module wrappers in Jayess source where practical.
- [x] Add compile-validation and executable-runtime verification for each new host-module slice together.
- [x] Keep raw `node:*` imports and non-approved host APIs rejected with focused diagnostics.
- [x] Update host/system-module docs after each slice lands.

## 314. Regex Expansion

- [x] Define the next approved `jayess:regex` slice explicitly: flags policy, `split`, `matchAll`, replacement helpers, and result-shape policy as separate tasks.
- [x] Decide whether regex literals remain unsupported by design or become an explicitly approved parser slice.
- [x] Add only the native/runtime support needed for the approved next regex helper family.
- [x] Implement the approved next `jayess:regex` helpers in Jayess source where practical.
- [x] Add semantic diagnostics for still-unsupported ambient/global regex forms.
- [x] Add compile-validation and executable-runtime verification for the new regex slice.
- [x] Update regex docs after the next slice lands.

## 315. Date, JSON, Map, And Set Depth

- [x] Define the next approved `jayess:date` slice explicitly: richer formatting, richer parsing, arithmetic helpers, and timezone policy as separate tasks.
- [x] Define the next approved `jayess:json` slice explicitly: validation, transform/replacement policy, and formatting helpers as separate tasks.
- [x] Define the next approved `jayess:collections/map` slice explicitly: bulk construction, bulk updates, and data/iteration helpers as separate tasks.
- [x] Define the next approved `jayess:collections/set` slice explicitly: union/intersection/difference, bulk construction, and data/iteration helpers as separate tasks.
- [x] Add only the primitive/runtime support needed for the approved next built-in-module helpers.
- [x] Implement the approved next module-level helpers in Jayess source where practical.
- [x] Add API, runtime, and executable verification for each next built-in-module slice separately.
- [x] Update built-in module docs after each next slice lands.

## 316. Codegen And Runtime Structure Polish

- [x] Audit large backend files for repeated codegen patterns that can be extracted into focused helpers without semantic change.
- [x] Audit runtime fragment layout for oversized mixed-responsibility files and split one responsibility at a time where needed.
- [x] Tighten generated symbol/name stability so repeated runs keep stable helper names where practical.
- [x] Improve generated project readability only where it does not change semantics or file layout guarantees.
- [x] Reduce codegen duplication across async, generator, and class lowering where one shared narrow helper is justified.
- [x] Add regression tests or snapshot updates only where codegen shape intentionally changes.
- [x] Update generated-project and runtime-architecture docs after any structural cleanup lands.

## 317. Diagnostics And Native Interop UX

- [x] Audit parser diagnostics so unsupported-by-design features are consistently distinguished from not-yet-implemented slices.
- [x] Audit semantic diagnostics for built-in-module guidance, especially `jayess:*` replacements for ambient JavaScript/Node names.
- [x] Audit module-resolution diagnostics for missing packages, unsupported targets, and invalid native artifacts.
- [x] Audit native-import diagnostics for headers, source files, shared libraries, and static libraries.
- [x] Add or tighten docs that show recommended small C++ adapter patterns for awkward native APIs.
- [x] Add focused tests for improved diagnostic wording where the messages are part of the intended developer UX.

## 318. `jayess:image` Depth And Hardening

- [x] Audit the shipped `jayess:image` exports against the runtime/image docs and lock the exact first-class supported file-format matrix in `docs/jayess-image-module.md`.
- [x] Add focused malformed-input validation tests for `loadPpm`, `loadPgm`, `loadBmp`, and `loadTga`, including truncated headers, invalid dimensions, unsupported bit depths, and overflow-prone sizes.
- [x] Tighten image runtime bounds, dimension, allocation, and multiplication overflow checks so hostile width/height values fail before large allocations.
- [x] Add bytes-first helper slices for non-filesystem image transport only where the runtime already has a deterministic implementation path.
- [x] Define and implement one narrow bulk pixel-operation helper family so higher-level drawing code can avoid repeated per-pixel wrapper overhead.
- [x] Define and implement one narrow image-view/subimage slice only if it can preserve lifetime safety and avoid mutable aliasing surprises.
- [x] Add executable runtime verification for every shipped image format round-trip and for crop, resize, rotate, flip, blit, and transparent blit edge cases.
- [x] Update generated-project and runtime-verification docs if image helpers add new runtime fragments or bytes-oriented helper paths.

## 319. `jayess:canvas` Drawing And State Expansion

- [x] Audit the shipped `jayess:canvas` drawing surface against `jayess:image` so overlapping responsibilities stay clearly separated.
- [x] Define the next approved canvas state slice explicitly: transform stack, clip stack, or draw-state save/restore as separate tasks rather than one umbrella feature.
- [x] Implement the first approved canvas state helper family in Jayess source without making `jayess:canvas` depend on native window or GPU code.
- [x] Define and implement one narrow stroke-style slice such as stroke width plus line caps or joins, keeping fill and stroke behavior deterministic.
- [x] Tighten alpha-blending consistency across rectangles, image blits, and future stroke/fill helpers so all canvas paths share one explicit compositing rule.
- [x] Extract one focused repeated scanline or shape helper out of `stdlib/jayess/canvas/index.js` if the current file grows further.
- [x] Add executable image-golden verification for clipping, overlap ordering, alpha blending, curves, polygons, and text-box layout.
- [x] Update `docs/jayess-canvas-module.md` with explicit per-export edge cases, especially clipping, out-of-bounds drawing, and deterministic text behavior.

## 320. `jayess:window` Cross-Platform Adapters, X11, Wayland, And Event Loop

- [x] Audit the current `jayess:window` surface, docs, and tests so the real Linux/X11-backed behavior is separated clearly from guarded placeholder adapters.
- [x] Tighten the platform-neutral window handle/runtime layer in `src/cpp/runtime-window-source.js` so create/show/close/requestClose/pollEvents/present invariants are explicit and adapter-independent.
- [x] Add executable runtime verification for current X11 window lifecycle, present, resize, close, keyboard, and mouse event normalization.
- [x] Implement the first Windows adapter slice with Win32 window creation, title changes, close lifecycle, event polling, and software-buffer presentation through a narrow GDI/DIB path.
- [x] Implement the first macOS adapter slice in a focused Objective-C++ runtime fragment with create/show/close/title/event/present parity matching the normalized window surface.
- [x] Define the first Wayland adapter boundary explicitly in docs and runtime metadata so it stays separate from the X11 adapter and does not leak protocol details into the public Jayess API.
- [x] Implement the first Wayland adapter slice with create/show/close, normalized close and resize events, and software-buffer presentation through a narrow Wayland client path.
- [x] Add adapter-selection logic and generated metadata so Linux builds report whether X11, Wayland, or both adapters are compiled into the generated project.
- [x] Normalize platform-unavailable and adapter-unavailable diagnostics so Linux/X11, Linux/Wayland, Windows, and macOS all fail with deliberate messages instead of host-specific crashes.
- [x] Define and implement a focused event-loop helper layer shared with `jayess:timers`, keeping `pollEvents(window)` explicit while adding one narrow frame/update scheduling path for real apps.
- [x] Add executable runtime verification for both Linux/X11 and Linux/Wayland code paths where host availability permits, with explicit skipped-host diagnostics where it does not.
- [x] Update `docs/jayess-window-module.md`, `docs/jayess-native-gui.md`, and generated-project metadata docs after each adapter slice lands.

## 321. Jayess-Owned GUI Toolkit Over `image`, `canvas`, And `window`

- [x] Add a dedicated `docs/jayess-gui-toolkit.md` file that defines the first Jayess-owned toolkit direction over `jayess:image`, `jayess:canvas`, and `jayess:window`.
- [x] Define the first toolkit object model explicitly: application, window state, widget tree, layout pass, paint pass, and event dispatch as separate responsibilities.
- [x] Define the first approved widget slice explicitly instead of broad “GUI toolkit”: label, button, panel, stack/column/row layout, and text input as separate later tasks.
- [x] Implement the first minimal toolkit module in Jayess source only after the window/event-loop invariants are stable.
- [x] Keep toolkit rendering purely canvas-based for the first slice so the toolkit does not depend on `jayess:gpu`.
- [x] Define and implement one narrow invalidation/repaint path so window presentation repaints only through explicit toolkit update/draw steps.
- [x] Add focused executable runtime verification for first-toolkit interaction behavior: layout, hover/click dispatch, and redraw after state changes.
- [x] Update docs so contributors understand that Jayess’s default GUI direction is its own toolkit, not browser DOM or Node.js GUI compatibility.

## 322. `jayess:gpu` Real Backend Implementation

- [x] Audit the shipped `jayess:gpu` docs, wrappers, and runtime fragments so placeholder command validation is distinguished clearly from real backend support.
- [x] Define the first real backend slice explicitly: resource lifetime, texture format subset, shader source policy, pipeline shape, and presentation model as separate tasks.
- [x] Implement one focused software or validation backend path for deterministic tests so frame-command validation does not depend entirely on hardware-backed execution.
- [x] Implement the first Windows real backend slice behind the existing backend boundary, keeping Direct3D-specific details inside focused adapter files.
- [x] Implement the first macOS real backend slice behind the existing backend boundary, keeping Metal-specific details inside focused adapter files.
- [x] Choose one Linux real backend slice for actual implementation first and keep the other Linux backend as a later separate slice instead of mixing Vulkan and OpenGL in one pass.
- [x] Tighten backend capability metadata so devices, surfaces, buffers, textures, shaders, pipelines, and frames expose only the minimal stable fields the Jayess layer needs.
- [x] Define and implement one narrow resource-upload path from `jayess:image` or `jayess:bytes` into GPU textures without making `jayess:canvas` depend on GPU.
- [x] Add executable runtime verification for backend-unavailable diagnostics, validation-backend command recording, and one real backend clear/draw/present round-trip per supported host family.
- [x] Update `docs/jayess-gpu-module.md`, `docs/jayess-native-gui.md`, and generated metadata docs after the first real backend slice lands.

## 323. `jayess:http` Cross-Platform Production Server Hardening

- [x] Audit the current `jayess:http` runtime and docs so plain HTTP client/server scope, unsupported host behavior, and non-TLS boundaries are explicit.
- [x] Implement the first Windows server/runtime support slice so `createServer`, request parsing, response sending, and `close(server)` are not Unix-only.
- [x] Tighten HTTP request parsing with explicit limits for header count, header size, request line size, and malformed request rejection.
- [x] Define and implement one explicit connection timeout policy for idle sockets, header read time, and body read time.
- [x] Add request-body and response-body size guardrails with deliberate defaults and per-request override hooks where the current API already has a place for them.
- [x] Implement keep-alive handling deliberately, including connection close semantics, response completion rules, and invalid pipelining rejection if pipelining is not supported.
- [x] Add graceful server shutdown semantics: stop accepting, finish or time out active requests, then close sockets predictably.
- [x] Tighten static-file serving path normalization, MIME lookup behavior, and file-send error handling under concurrent access.
- [x] Define and implement one streaming body path that does real incremental send/receive behavior instead of fully buffering first where the current helpers do so.
- [x] Add executable runtime verification for malformed requests, oversized headers, idle timeout, graceful shutdown, concurrent requests, and Windows plus Unix lifecycle parity.
- [x] Add or update docs to state clearly what “production level” means for the shipped `jayess:http` slice and what still remains out of scope such as TLS until `jayess:crypto` and certificate support are ready.

## 324. `jayess:dialog` Native Platform Dialogs

- [x] Add `docs/jayess-dialog-module.md` defining the first Jayess-owned native dialog surface and its explicit cross-platform boundaries.
- [x] Define the first approved dialog exports explicitly: `openFile(options)`, `saveFile(options)`, `openDirectory(options)`, and `message(options)`.
- [x] Define normalized result shapes and cancellation behavior so dialogs return plain Jayess values instead of host-specific handle types.
- [x] Implement the platform-neutral runtime and bridge layer for dialog option validation, result normalization, and unavailable-host diagnostics.
- [x] Implement the first Windows dialog adapter slice using platform-native open/save/message APIs.
- [x] Implement the first macOS dialog adapter slice using platform-native open/save/message APIs.
- [x] Define the first Linux dialog adapter path explicitly around a no-default-third-party approach and keep it separate from X11/Wayland window adapters.
- [x] Implement the first Linux dialog adapter slice only through the approved no-default-third-party path, with normalized unavailable diagnostics where the host path cannot be used.
- [x] Add executable runtime verification for result normalization, cancellation, invalid-option diagnostics, and platform-unavailable diagnostics.
- [x] Update standard-library docs, module matrix docs, and generated metadata docs after the first dialog slice lands.

## 325. `jayess:crypto` Hardening, Modernization, And Platform Security Hooks

- [x] Audit the current `jayess:crypto` surface so the docs clearly distinguish shipped digest/HMAC/random support from unimplemented broader cryptographic APIs.
- [x] Tighten `randomBytes(count)` so the runtime uses explicit platform CSPRNG sources per host family instead of relying on weaker unspecified randomness behavior.
- [x] Add a constant-time byte comparison helper in the most appropriate Jayess-owned module and document when it should be used instead of ordinary equality.
- [x] Define the next approved hash/KDF slice explicitly, keeping SHA-512, HKDF, and any later AEAD or public-key work as separate tasks.
- [x] Implement the first approved modern hash/KDF slice in focused runtime fragments without widening the public API beyond what docs approve.
- [x] Mark SHA-1 as legacy-only in docs and diagnostics while keeping existing behavior stable for compatibility where already shipped.
- [x] Add executable runtime verification for random-byte length and variability, streaming-hash correctness, HMAC correctness, and constant-time helper semantics where testable.
- [x] Define the first approved certificate/key/TLS-supporting primitive direction only when it is needed by `jayess:http`, keeping raw crypto and transport security responsibilities separate.
- [x] Update `docs/jayess-crypto-module.md`, `docs/overview.md`, and related stdlib docs after each crypto hardening slice lands.

## 326. GPU Host-Probe Portability Follow-Up

- [x] Normalize the Win32 host-backed GPU executable probe so unsupported local Windows executable-test toolchains skip explicitly instead of failing through raw process-abort status codes.
- [x] Keep the host-backed GPU runtime probes narrow and host-conditional rather than broadening them into unstable all-toolchain assertions.
- [x] Update GPU runtime-verification docs so host-backed probe behavior is described as host- and toolchain-conditional where that is the current shipped reality.

## 327. Crypto PEM Container Groundwork

- [x] Implement the first shipped `jayess:crypto` PEM certificate container helper in a focused Jayess-owned helper module instead of widening the native runtime.
- [x] Implement the matching private-key and trust-anchor PEM container helpers with deliberate normalized result shapes and focused diagnostics.
- [x] Add focused output, compile, and executable runtime verification for PEM container normalization and invalid-label diagnostics.
- [x] Update crypto, overview, standard-library, and runtime-verification docs after the PEM container slice lands.

## 328. Built-In Buffer Module Audit Repair

- [x] Repair the shipped `jayess:buffer` and `jayess:canvas` modules so their internal helper ordering matches Jayess no-hoist semantics during stdlib transpilation.
- [x] Re-run the documented built-in-module audit and the focused buffer/canvas output, runtime, and compile checks after the repair.

## 329. Runtime Handle Diagnostics Test Sync

- [x] Update the broader diagnostics regression so it matches the shipped shared invalid-handle message form instead of the older pre-helper wording.
- [x] Re-run the focused diagnostics source/runtime tests after the handle-diagnostics sync.
