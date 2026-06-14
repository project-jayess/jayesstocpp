# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler.

Completed milestones through section 378 were moved to [archived-checklist.md](./archived-checklist.md) to keep the working checklist small and focused.

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

## 379. Console Standard Input Helpers

- [x] Add focused `jayess:console` stdin helpers for one-line input, whole-stdin input, and prompt-style input.
- [x] Add output, compile, and executable runtime coverage for the console input helpers.
- [x] Update console, overview, brief, and standard-library docs after the input helper slice lands.

## 380. Reachable Symbol Emission For Package And Standard-Library Imports

- [x] Preserve requested named import lists and resolved export origins in module graph metadata for relative, package, self-reference package, package-private, re-export, and `jayess:*` imports.
- [x] Add a reachability pass that starts from the entry module, top-level executable requirements, explicit exports, executable `main()`, and named import lists, then marks only required declarations for those named imports.
- [x] Track declaration-to-declaration references inside each module so imported functions retain their local helper functions, required top-level initializers, and transitive imported symbols without retaining unrelated exports.
- [x] Distinguish safe declaration-level emission from whole-module cases: default imports, namespace imports, side-effect imports, mixed import forms, ambiguous export-all chains, import cycles, unsupported AST shapes, and inseparable top-level side effects.
- [x] Teach C++ emission to accept a retained declaration set per module and skip unreachable exported and local declarations while preserving module initialization order and Jayess lifetime semantics.
- [x] Prune native header/source/library artifacts to only those referenced by reachable declarations, while still copying artifacts required by side-effect imports or fallback whole-module emission.
- [x] Prune runtime fragments based on reachable emitted code instead of including runtime families only because a broad source module was imported.
- [x] Emit generated metadata for requested import names, reachable exports, retained declarations, pruned declarations where practical, retained native artifacts, retained runtime fragments, and whole-module reasons.
- [x] Add focused tests showing `import { readTextSync, writeTextSync } from "jayess:fs"` does not emit unrelated FS exports or unrelated native/runtime fragments.
- [x] Add package import and re-export tests showing named import lists retain only the referenced package declarations and helpers, with explicit whole-module metadata for default imports, namespace imports, side-effect imports, mixed imports, cycles, and ambiguous re-exports.
- [x] Add executable compile tests comparing a small named-import program against generated source lists/metadata to prevent regressions that package whole standard-library modules unnecessarily.
- [x] Update docs after the implementation lands with current limitations, fallback metadata examples, and guidance for standard-library authors.

## 381. Scope Lifetime And Output Planning Hardening

- [x] Add focused tests that prove `analyzeEscapes()` results are passed into every C++ emission path used by `transpile()` and `transpileFile()`.
- [x] Add a small lifetime metadata shape for emitted modules that records local bindings, captured bindings, returned values, exported values, and values stored into module state.
- [x] Teach C++ emission to consume the lifetime metadata for one safe value category first, preserving current output for unsupported lifetime shapes.
- [x] Add compile tests for the first lifetime-emission slice covering ordinary locals, early return, thrown Jayess values, and closure captures.
- [x] Add runtime tests or generated-source assertions showing escaping values remain valid after their defining scope exits.
- [x] Keep lifetime fallback behavior explicit in generated metadata when the emitter preserves the current broad-safe behavior for unsupported shapes.
- [x] Extract native artifact copying from `src/api/transpile-file.js` into a focused output helper that preserves current path safety, diagnostics, and retained-artifact metadata.
- [x] Extract emitted-module metadata planning from `src/api/transpile-file.js` into a focused output helper that preserves generated path stability and module namespace stability.
- [x] Extract emitted-module retention decisions from `src/api/transpile-file.js` into a focused helper shared by metadata planning, source writing, and runtime-feature analysis.
- [x] Add focused tests for the extracted output-planning helpers covering skipped unreachable modules, retained re-export-only modules, retained native artifacts, and side-effect native artifacts.
- [x] Add Windows-safe path assertion helpers for module graph tests instead of using raw slash-sensitive `endsWith(...)` checks.
- [x] Update module graph tests to use the Windows-safe path helpers for package subpaths, package export conditions, self-reference exports, package imports, and package export arrays.
- [x] Run and fix `test/modules/module-graph.test.js` on Windows so path formatting does not create false failures.
- [x] Extend declaration-level stdlib pruning policy beyond the focused `jayess:fs` text-helper slice to one additional low-risk declaration-only module.
- [x] Add reachability and compile tests showing the additional pruned stdlib module omits unrelated exports, transitive stdlib modules, native bridge artifacts, and runtime fragments.
- [x] Add a package release smoke test that imports the package root API from a temporary project under `temp/` and verifies `transpile` and `transpileFile` are available.
- [x] Add an npm package dry-run check or test fixture that verifies `files` includes `src/`, `stdlib/`, `README.md`, `LICENSE`, and `package.json` while excluding generated `custom-test/**/cpp` and `custom-test/**/dist` artifacts.
- [x] Add an internal JavaScript tool script under `tools/` for developer-only transpiler testing that delegates to `transpileFile()` and writes generated output under a caller-provided target directory.
- [x] Keep the internal transpile tool out of package exports and do not add it as an npm `bin`, because public CLI behavior belongs to the separate CLI project that consumes this package.
- [x] Add internal tool smoke tests under `test/` or focused script validation that transpile a small fixture into `temp/` and verify generated metadata and executable entrypoint files.
- [x] Document the lifetime-emission slice in `docs/lifetime-model.md` with supported shapes, fallback metadata, and non-goals.
- [x] Document output-planning helper responsibilities in `docs/generated-project-layout.md` or a focused `/docs` markdown file.
- [x] Document package usage and the developer-only `tools/` transpile script in `README.md`, Agents.md and a focused `/docs` markdown file after the package/tool smoke tests land, explicitly noting that this package does not export a public CLI.
- [x] Keep source files and tests small by splitting any new lifetime, output-planning, package-smoke, or CLI work into focused modules instead of expanding already-large files.

## 382. Subprocess Compile And Runtime Regression Fixes

- [x] Capture the current `test/cpp/subprocess-compile.test.js` failure output under `temp/` and confirm the first compile blocker is the Windows UCRT `stdout` and `stderr` macro collision in generated `jayess:subprocess` symbols.
- [x] Inspect generated `generated-stdlib/jayess/subprocess/stdlib_jayess_subprocess_index_js.hpp`, `.cpp`, and importing entry modules to list every raw generated C++ symbol/reference named `stdout` or `stderr`.
- [x] Add a narrow C++ identifier sanitization or exported-symbol mapping layer for names that collide with native macros/globals such as `stdout` and `stderr`, without changing the public Jayess export names.
- [x] Ensure generated declarations, definitions, namespace member references, callable wrappers, metadata, and import bindings all use the same macro-safe C++ symbol name for subprocess `stdout` and `stderr`.
- [x] Add a focused generated-output regression test proving `jayess:subprocess` public exports remain `stdout` and `stderr` while generated C++ declarations/references do not contain macro-colliding function symbols.
- [x] Re-run `node --test test/cpp/subprocess-compile.test.js` and verify the subprocess fixture compiles with the available Windows C++ compiler.
- [x] Capture the current `test/cpp/subprocess-runtime.test.js` `ENOENT` failure under `temp/` and confirm whether the test helper compiled `subprocess-runtime-test.exe` while attempting to execute `subprocess-runtime-test`.
- [x] Fix the subprocess runtime compile/run helper to return the actual platform executable path, including `.exe` on Windows, and surface compile/link failures before attempting to spawn the executable.
- [x] After the runtime executable is launched correctly, inspect `jayess_subprocess` runtime state and completion result construction to verify exit code, signal/status, stdout, stderr, and error fields are stored deterministically.
- [x] Add focused subprocess runtime assertions for completion data shape and argument validation, keeping test fixtures small and isolated from unrelated process features.
- [x] Fix subprocess runtime completion data capture without introducing platform-specific shell assumptions or broad long-lived state that violates Jayess lifetime rules.
- [x] Fix subprocess argument validation diagnostics so invalid command, argument array, environment, working directory, and options shapes fail clearly before launching a host process.
- [x] Re-run `node --test test/cpp/subprocess-runtime.test.js` after the runtime fix and verify both completion data and invalid argument cases pass.
- [x] Re-run `npm run test:unit` and the focused compile/runtime subprocess tests after the subprocess slice lands.
- [x] Update `docs/` with the supported subprocess API behavior, completion result fields, validation rules, and any platform-normalized behavior exposed by `jayess:subprocess`.

## 383. Static Super Semantic And Compile Regression

- [x] Capture the failing source from `test/cpp/class-compile.test.js` for `transpile deeper inherited static lookup output compiles with the available C++ compiler` into a temporary note under `temp/`.
- [x] Inspect semantic `super` validation and identify why `super.name` is rejected in derived static methods while computed `super[expr]` already reports static-method wording.
- [x] Update semantic analysis to allow `super.name` and `super[expr]` inside derived static methods while preserving diagnostics for non-derived classes, top-level code, ordinary functions, and unsupported non-method contexts.
- [x] Prevent duplicate or contradictory `JY_SEMANTIC_SUPER_UNSUPPORTED` diagnostics for the same static `super` expression.
- [x] Verify C++ lowering for deeper inherited static lookup resolves through the derived class static inheritance chain instead of instance method dispatch or ordinary property access.
- [x] Add focused semantic and C++ compile coverage for static `super.name`, computed static `super[expr]`, deeper inherited static lookup, and invalid static `super` contexts.
- [x] Re-run `node --test test/cpp/class-compile.test.js` and verify the deeper inherited static lookup fixture reaches C++ compilation and passes.

## 384. Entry-Module Callback Function-Value Lowering Regressions

- [x] Capture generated `async_main_js.cpp` and `events_main_js.cpp` failure snippets under `temp/`, including undeclared callback identifiers `recover`, `remember`, `eventually`, `first`, and `second`.
- [x] Inspect entry-module C++ emission for function declarations referenced in value position and identify why callback arguments are emitted as raw identifiers instead of Jayess callable values.
- [x] Split direct function-call target lowering from function-value lowering so `foo()` can call the generated function symbol directly while `bar(foo)` emits a callable wrapper/value.
- [x] Apply the function-value lowering path consistently in `transpileFile()` executable entry modules, generated stdlib modules, and retained named-import module output.
- [x] Add focused generated-output tests proving callbacks passed to `jayess:async` helpers `catchError`, `finallyDo`, and `retry` are boxed as callable values rather than raw C++ identifiers.
- [x] Add focused generated-output tests proving callbacks passed to `jayess:events` helpers `on`, `once`, and `off` are boxed as callable values rather than raw C++ identifiers.
- [x] Verify generated `jayess::call(...)` argument vectors contain only `jayess::value`-compatible values and never raw C/C++ function symbols, native macros, or unresolved local identifiers.
- [x] Re-run `node --test test/cpp/stdlib-compile.test.js` and verify the built-in async and events module project compile fixtures pass with the available C++ compiler.

## 385. Window Canvas HTML Custom Probe

- [x] Add a focused `custom-test/window-canvas-html/src/` Jayess program that renders HTML and CSS through `jayess:canvas`.
- [x] Save deterministic off-screen canvas output into `custom-test/window-canvas-html/dist/`.
- [x] Present the rendered canvas through `jayess:window` with one explicit show, present, poll, request-close, and close sequence.
- [x] Add a small internal `/tools` compile helper for generated Jayess C++ projects without exporting it as an npm package CLI.
- [x] Document the manual probe and host-adapter runtime caveat in `/docs`.

## 386. Primitive Property Runtime Probe Fix

- [x] Reproduce the canvas HTML layout crash caused by probing object-like fields such as `value.top` on numeric box values.
- [x] Update generated runtime property reads so non-object and non-callable receivers return `null` instead of throwing `std::bad_variant_access`.
- [x] Add a focused runtime fixture proving primitive property reads return `null` for numeric and string receivers.
- [x] Rebuild and rerun the window/canvas custom probe after the runtime fix.

## 387. Canvas HTML Layout String Helper Fix

- [x] Reproduce the generated C++ runtime crash caused by `html-layout.js` using JavaScript string methods inside Jayess standard-library source.
- [x] Replace `text.split(...)` and `word.slice(...)` with explicit `jayess:string` helper imports in the canvas HTML layout module.
- [x] Add a focused runtime test that transpiles, compiles, and runs the canvas HTML render fixture and verifies a PPM file is produced.
- [x] Rebuild and rerun the window/canvas custom probe after the layout helper fix.

## 388. Window Canvas Manual Visibility Fix

- [x] Identify that the custom window/canvas probe closed immediately after one `present(...)` call and used a tiny 48x24 window.
- [x] Increase the manual probe canvas/window size to a visible 320x180 surface.
- [x] Add a console prompt after presentation so the native window stays open until the tester presses Enter.
- [x] Update the custom probe documentation to explain the pause and manual testing behavior.

## 389. Window Canvas Probe Working Directory Fix

- [x] Reproduce the manual run failure when launching `window-canvas-html.exe` from `custom-test/window-canvas-html/dist`.
- [x] Change the probe to write `window-canvas-html.ppm` relative to the current executable working directory instead of a repository-root-relative path.
- [x] Update docs to tell manual testers to run the executable from `custom-test/window-canvas-html/dist`.
- [x] Rebuild and smoke-run the custom probe from its `dist` directory.

## 390. Window Canvas Responsive Event Loop Fix

- [x] Identify that the manual probe blocked the native window message pump by waiting on console `prompt(...)`.
- [x] Replace the blocking prompt with an explicit `pollEvents(...)`, `present(...)`, and short sleep loop.
- [x] Keep the native close/minimize/maximize controls responsive by exiting only when `shouldClose(window)` becomes true.
- [x] Add simple rendered-content click feedback by hit-testing left mouse-up events against the canvas HTML document.
- [x] Update documentation to describe the responsive manual event loop.

## 391. License-Safe Default Font And Multi-Font Support

- [x] Audit current `jayess:canvas` text rendering and document every public path that currently emits block placeholder glyphs, including `text(...)`, `drawTextBox(...)`, `measureText(...)`, HTML/CSS paint, and `jayess:font` helpers.
- [x] Choose a license-safe bundled default font strategy that can ship in the npm package without attribution or redistribution risk, preferring an original minimal bitmap font authored in this repository or a clearly permissive public-domain/OFL bitmap source with license text preserved under `docs/` or `stdlib/` metadata.
- [x] Add a small, focused default font asset module under `stdlib/jayess/font/` instead of embedding glyph tables directly in `jayess:canvas`.
- [x] Define a compact Jayess-owned bitmap font data shape with glyph width, glyph height, advance, baseline, line height, and per-glyph bitmap rows for ASCII text first.
- [x] Implement `defaultFont()` in `jayess:font` so canvas and HTML/CSS rendering can get a readable font without user setup.
- [x] Implement `createFont(name, glyphs, metrics)` or an equivalent constructor for custom in-memory bitmap fonts.
- [x] Implement `loadFont(name, path, options)` for loading deterministic bitmap/JSON font assets from disk, using existing Jayess file/string/json helpers where practical.
- [x] Implement a small font registry with `registerFont(font)`, `getFont(name)`, and `setDefaultFont(name)` so multiple fonts can be available at the same time.
- [x] Keep font registry state explicit and scoped to generated runtime/module state where possible; avoid hidden global behavior that makes tests order-dependent.
- [x] Update `jayess:font` measurement helpers to calculate readable glyph advances, line heights, multi-line dimensions, and missing-glyph fallback metrics from selected font data.
- [x] Replace `jayess:canvas` block-glyph placeholder drawing with calls into `jayess:font` drawing helpers while keeping canvas responsible for pixels, clips, transforms, and colors.
- [x] Preserve `jayess:canvas` public `text(...)`, `measureText(...)`, and `drawTextBox(...)` APIs, adding optional `font` or `fontFamily` option handling without breaking existing callers.
- [x] Update `jayess:canvas` HTML/CSS style resolution to support `font-family` and route `font-size` plus selected font into text measurement and painting.
- [x] Add deterministic missing-glyph behavior so unsupported characters render as a readable fallback box or question glyph instead of crashing.
- [x] Add focused generated-output tests proving `jayess:canvas` imports only the needed `jayess:font` symbols for text rendering.
- [x] Add runtime tests that render text with the default font and verify selected pixels differ from the old solid square placeholder shape.
- [x] Add runtime tests that register or load two fonts and verify different selected font families produce different deterministic output.
- [x] Update `custom-test/window-canvas-html` to use the default readable font in the live window probe.
- [x] Add an optional custom-test font-loading example under `custom-test/font/` with `src/`, generated `cpp/`, and local `dist/` output.
- [x] Document the default font license status, bundled asset origin, supported glyph range, custom font format, multiple-font registry, and HTML/CSS `font-family` behavior in `/docs`.
- [x] Update `README.md`, `jayess.md`, and relevant standard-library docs to state that Jayess ships a readable license-safe default bitmap font and supports loading/registering multiple fonts.
- [x] Run focused unit/runtime tests for `jayess:font`, `jayess:canvas`, and canvas HTML/CSS output after the font slice lands.

## 392. Canvas HTML/CSS Renderer Compatibility Upgrade

- [x] Reproduce the manual `custom-test/window-canvas-html` failure caused by CSS percentage sizes such as `width: 100%` and `height: 100%`, and capture the current diagnostic under `temp/`.
- [x] Split CSS value parsing into a focused helper module, for example `stdlib/jayess/canvas/css-values.js`, so lengths, percentages, keywords, colors, and box shorthands are not mixed into the rule parser.
- [x] Define a Jayess-owned CSS value shape for supported lengths: `{ kind: "px", value }`, `{ kind: "percent", value }`, `{ kind: "auto" }`, and preserve existing numeric pixel behavior through a compatibility conversion path.
- [x] Update `parseCss(...)` and `parseInlineStyle(...)` to accept `px`, unitless numeric pixels, `%`, and `auto` for width, height, min/max sizes, font-size, border-width, border-radius, gap, margin, and padding where appropriate.
- [x] Add clear diagnostics for unsupported length units such as `em`, `rem`, `vh`, `vw`, `calc(...)`, and malformed percentages instead of reporting the generic numeric-size error.
- [x] Update margin and padding shorthand parsing to support mixed pixel and percentage values while keeping one-to-four-value expansion and per-side metadata.
- [x] Add a small layout resolver helper, for example `stdlib/jayess/canvas/css-layout-values.js`, that resolves CSS value objects against the parent content box before `html-layout.js` computes boxes.
- [x] Implement percentage width resolution against the containing block content width for block elements, buttons, inputs, paragraphs, and inline-like wrappers.
- [x] Implement percentage height resolution against the containing block content height when the parent has a definite height, including `height: 100%` on the root child of `layoutHtml(document, bounds)`.
- [x] Preserve `auto` sizing for content-driven nodes while making explicit percentage sizing override content fallback width or height.
- [x] Apply min/max constraints after resolving percentages and auto fallback sizes so `min-width`, `max-width`, `min-height`, and `max-height` remain deterministic.
- [x] Update content-box, padding-box, border-box, and margin-box calculations so `width` and `height` semantics are documented and consistently applied to painting and hit testing.
- [x] Add first-slice `box-sizing` support with `content-box` and `border-box`, defaulting to the documented behavior and rejecting unsupported values with focused diagnostics.
- [x] Improve selector parsing to support comma-separated selector lists without adding a full CSS parser or browser specificity model.
- [x] Add focused support for simple child selectors such as `div > p` if it can be implemented without broad selector-engine complexity.
- [x] Add focused CSS comments stripping so ordinary `/* comment */` blocks do not break parsing.
- [x] Add focused HTML parser support for common self-closing syntax, boolean attributes such as `disabled`, and unquoted simple attribute values if the parser can keep deterministic diagnostics.
- [x] Add layout tests for root `div { width: 100%; height: 100%; }` filling the full canvas bounds.
- [x] Add layout tests for nested percentage widths, definite parent heights, auto heights, min/max constraints, padding, border width, and `box-sizing`.
- [x] Add paint tests proving percentage-sized backgrounds, borders, overflow clipping, and text are drawn at the resolved dimensions.
- [x] Add hit-test tests proving percentage-sized boxes return correct `targetId`, `role`, disabled metadata, and bounds.
- [x] Add generated C++ runtime tests that transpile, compile, and run percentage-size HTML/CSS fixtures through `jayess:canvas`.
- [x] Update `custom-test/window-canvas-html` to use realistic CSS with `width: 100%`, `height: 100%`, padding, border, text, and button hit testing after percentage layout lands.
- [x] Rebuild and smoke-run `custom-test/window-canvas-html` from `custom-test/window-canvas-html/dist` after the renderer compatibility slice lands.
- [x] Document supported CSS value units, percentage sizing rules, `box-sizing`, selector support, HTML attribute support, and known non-goals in `docs/jayess-canvas-html-css.md`.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-native-gui.md`, and `README.md` to state that the canvas HTML/CSS renderer supports deterministic percentage-based layout for native canvas windows.
- [x] Keep parser, style resolution, layout, paint, and hit-test changes split across focused files instead of expanding `stdlib/jayess/canvas/index.js` or creating a renderer god file.

## 393. Vector And Web Font File Support

- [x] Add a focused font-file format probe under `test/fixtures/runtime/` with small license-safe `.ttf`, `.otf`, `.woff`, and `.woff2` samples or generated/minimal fixture bytes plus explicit license/source notes.
- [x] Add a `jayess:font` file-kind detector that recognizes `.ttf`, `.otf`, `.woff`, `.woff2`, bitmap JSON fonts, and unsupported extensions without changing the existing bitmap font registry behavior.
- [x] Add a native font runtime fragment split into focused files, for example `src/cpp/runtime-font-source.js`, `src/cpp/runtime-font-truetype-source.js`, and `src/cpp/runtime-font-web-source.js`, instead of expanding unrelated canvas or image runtime files.
- [x] Define a Jayess-owned vector font handle shape that records font name, source path, source format, family metadata, ascent/descent/line-height metrics, glyph cache state, and fallback glyph metadata.
- [x] Add `loadFont(path, options)` support for `.ttf` files that reads the file through the generated runtime, validates the font header, creates a vector font handle, and returns a value compatible with `registerFont(...)`.
- [x] Add `.otf` loading support for OpenType fonts that use TrueType-style glyf outlines, and emit a focused diagnostic for CFF/CFF2 outlines until that outline path is implemented.
- [x] Add vector font measurement primitives for glyph advance, kerning-free text width, line height, multiline text size, and missing-glyph fallback metrics.
- [x] Add vector glyph rasterization primitives that render grayscale coverage into Jayess canvas pixels while preserving current canvas clipping, transform, color, and alpha behavior.
- [x] Update `jayess:font` so `measureText(...)`, `drawText(...)`, and `drawTextAligned(...)` dispatch between bitmap fonts and vector font handles without changing their public call shape.
- [x] Update `jayess:canvas` `measureText(...)`, `text(...)`, and `drawTextBox(...)` so `font`, `fontFamily`, `fontSize`, `charHeight`, `lineHeight`, and color options work for both bitmap and vector fonts.
- [x] Update the canvas HTML/CSS paint path so CSS `font-family` and `font-size` select registered TTF/OTF fonts exactly like bitmap fonts.
- [x] Preserve the original license-safe bitmap default as the fallback font when a requested vector font family is missing, invalid, or unsupported.
- [x] Add `.woff` decoding support that validates the WOFF wrapper, decompresses compressed table payloads through a focused runtime helper, reconstructs the underlying sfnt table data, and then reuses the TTF/OTF loader path.
- [x] Add `.woff2` decoding support through a focused Brotli-backed runtime helper or a small isolated decoder module, reconstructing the underlying sfnt table data before reusing the TTF/OTF loader path.
- [x] Keep any third-party font decoder or rasterizer code isolated under a narrow runtime support boundary with license text preserved, package distribution checked, and no broad GUI/browser/font-engine dependency copied into Jayess.
- [x] Add runtime diagnostics for missing font files, unsupported font formats, invalid table directories, unsupported CFF/CFF2 outlines, invalid WOFF compression metadata, invalid WOFF2 transform data, and rasterization failures.
- [x] Add generated metadata fields in `jayess_build_hints.json` and `jayess_dependency_plan.json` for retained font files, selected font runtime fragments, font decoder dependencies, and copied font artifacts.
- [x] Ensure `transpileFile()` copies reachable font assets only under the target directory and never writes font files back into the source tree.
- [x] Add output tests proving named imports from `jayess:font` retain only the required vector-font runtime fragments and do not force unrelated canvas, GUI, or window runtime fragments.
- [x] Add compile-validation tests for generated projects that load `.ttf`, `.otf`, `.woff`, and `.woff2` fonts and call `measureText(...)` without opening a native window.
- [x] Add executable runtime tests that render the same text with the default bitmap font and with a loaded vector font, then verify deterministic pixel differences and stable measured dimensions.
- [x] Add executable runtime tests that register two vector fonts and verify `fontFamily` selects the requested font in direct canvas text and HTML/CSS rendering.
- [x] Add a `custom-test/font-vector/src/` manual probe that loads `.ttf`, `.otf`, `.woff`, and `.woff2` fonts, draws labeled samples into a canvas, and writes generated C++ under `custom-test/font-vector/cpp/` plus local output under `custom-test/font-vector/dist/`.
- [x] Update `docs/jayess-font-module.md` with supported vector/web font formats, API examples, diagnostics, metadata, copied-asset behavior, and the distinction between bitmap fonts and vector font handles.
- [x] Update `docs/jayess-canvas-module.md`, `docs/jayess-canvas-html-css.md`, `docs/standard-library.md`, `docs/overview.md`, and `README.md` after the vector/web font slice lands.
- [x] Run focused lexer/parser-neutral unit tests, font/canvas output tests, compile-validation tests, and executable runtime font tests after the font-file support slice lands.

## 394. System Default Font Discovery And Fallback

- [x] Add a narrow `jayess:font` API for system default font discovery, for example `systemDefaultFont(options)` and `registerSystemDefaultFont(name, options)`, without changing existing `loadFont(...)`, `registerFont(...)`, or canvas text call shapes.
- [x] Define the returned system font handle shape so it records `kind`, `name`, `family`, `sourcePath`, `sourceFormat`, `systemFont`, `platform`, `fallbackUsed`, and the same metric fields expected by current vector font handles.
- [x] Keep system font discovery optional and deterministic: if no usable system font path is found, return or register the existing Jayess bitmap default rather than throwing during ordinary canvas/window text rendering.
- [x] Add a focused native runtime primitive boundary for system font discovery, for example `jayessFontSystemDefault(...)` in `stdlib/jayess/font/font-primitives.hpp` backed by a small `src/cpp/runtime-font-system-source.js` helper, instead of expanding unrelated canvas, window, or GUI runtime files.
- [x] Add Windows discovery that probes common default UI font locations and names, such as Segoe UI under `%WINDIR%/Fonts`, validates the file through the existing font loader path, and records a focused diagnostic or fallback flag when unavailable.
- [x] Add macOS discovery that probes common system font locations and names, such as `.SFNS`/San Francisco aliases or fallback Apple system fonts under `/System/Library/Fonts`, validates the file through the existing font loader path, and records a fallback flag when unavailable.
- [x] Add Linux discovery that checks common fontconfig-free paths and names first, such as DejaVu Sans or Noto Sans under `/usr/share/fonts`, then optionally uses a narrow `fc-match` adapter only when available and explicitly enabled by options.
- [x] Normalize discovered paths through platform-safe filesystem handling and never copy, mutate, or write system font files back into the source tree.
- [x] Route discovered `.ttf`, TrueType-style `.otf`, `.woff`, or `.woff2` files through the existing file-backed font validation, metrics, registry, and grayscale raster paths rather than creating a separate system-font rendering path.
- [x] Add explicit fallback behavior in `jayess:canvas` and `jayess:window` executable flows so missing or invalid system fonts still render text with `jayess-default-5x7`.
- [x] Add generated metadata in `jayess_build_hints.json` and `jayess_dependency_plan.json` describing whether system font discovery was enabled, which runtime fragment was retained, and whether a fallback font may be used at runtime.
- [x] Add output tests proving importing only the new system-font API retains the font/system-font runtime fragments without pulling unrelated canvas, GUI, window, or GPU fragments.
- [x] Add runtime tests with a forced missing-font option or empty search path proving `registerSystemDefaultFont(...)` falls back to the Jayess bitmap default and canvas text still renders deterministic pixels.
- [x] Add runtime tests with a temporary local search path containing a minimal license-safe TTF fixture proving system default discovery can find, validate, register, and select a discovered font handle without relying on host-installed fonts.
- [x] Add platform-normalized diagnostics tests for invalid discovered font files, unsupported formats, unreadable paths, and disabled discovery options.
- [x] Update `custom-test/font-vector` or add `custom-test/system-font/src/` to render samples with `registerSystemDefaultFont(...)`, write generated C++ under `cpp/`, and write local output under `dist/`.
- [x] Document the system font discovery API, platform search order, fallback behavior, metadata, non-goals, and host-font portability caveats in a focused `/docs` markdown file.
- [x] Update `docs/jayess-font-module.md`, `docs/jayess-canvas-module.md`, `docs/jayess-native-gui.md`, and `README.md` after the system default font slice lands.
- [x] Run focused font output tests, executable runtime font tests, and the manual system-font/custom-test probe after the implementation lands.

## 395. Default Font Coverage And System Font Probe Clarity

- [x] Update `custom-test/window-canvas-html` so it explicitly registers the system default font and selects it by `font-family`.
- [x] Add lowercase glyphs to the bundled `jayess-default-5x7` font instead of normalizing lowercase letters to uppercase.
- [x] Add a focused set of punctuation and special-character glyphs to the bundled default font for common UI text.
- [x] Add runtime tests proving lowercase and special characters exist in the default font and do not route through missing-glyph fallback.
- [x] Update font documentation to describe the expanded default glyph coverage and the current system-font rasterization caveat.
- [x] Rebuild `custom-test/window-canvas-html` after the probe and glyph updates.

## 396. Canvas HTML Text Spacing Probe Update

- [x] Stop forcing narrow `charWidth: fontSize / 2` in HTML painting so registered font metrics can drive text advance.
- [x] Use a wider deterministic text advance estimate in HTML layout wrapping to match the default 5x7 font proportions more closely.
- [x] Register the `window-canvas-html` system font probe with explicit readable fallback metrics.
- [x] Rebuild `custom-test/window-canvas-html` after the spacing update.

## 397. Crisp System Font Fallback And Paragraph Spacing

- [x] Render system-font fallback glyphs with crisp bitmap coverage while real OS outline rasterization is not implemented.
- [x] Increase paragraph vertical spacing in `custom-test/window-canvas-html` so adjacent text blocks are easier to read.
- [x] Update focused runtime expectations for system font fallback pixels.
- [x] Rebuild `custom-test/window-canvas-html` after the crisp fallback and spacing changes.
- [x] Add first-slice CSS `line-height` parsing, inheritance, layout, and painting support for wrapped HTML text.
- [x] Move the `window-canvas-html` probe line spacing into CSS and remove hardcoded system font metric overrides.
- [x] Update focused output/docs coverage for CSS `line-height`.
- [x] Rebuild `custom-test/window-canvas-html` after the CSS `line-height` update.

## 398. Default Bitmap Font Letter Spacing

- [x] Increase `jayess-default-5x7` default advance so rendered letters have extra horizontal spacing.
- [x] Update focused default font runtime expectations if the spacing change affects generated output.
- [x] Rebuild `custom-test/window-canvas-html` after the default spacing update.

## 399. Window Canvas HTML Probe Startup Cleanup

- [x] Confirm `custom-test/window-canvas-html` no longer retains system font discovery after removing system font registration.
- [x] Cache the bundled default glyph table so repeated default/fallback font use does not rebuild the glyph object.
- [x] Make the probe CSS select `jayess-default-5x7` explicitly instead of `system-ui`.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory.

## 400. Window Canvas HTML Startup Diagnostics

- [x] Add focused startup timing logs to `custom-test/window-canvas-html` for canvas creation, window creation/show, HTML render, and first present.
- [x] Show the native window before the initial HTML render so slow software rendering does not hide window startup.
- [x] Replace Jayess-level clipped rectangle fill loops with native image rectangle fill for canvas HTML background painting.
- [x] Capture startup timing output to confirm the remaining delay is no longer in the initial HTML rectangle paint.
- [x] Batch bitmap glyph row runs so text paint avoids one rectangle call per glyph pixel.
- [x] Replace rectangle stroke pixel loops with filled border bands for faster HTML box borders.
- [x] Document the `window-canvas-html` startup timing diagnosis under `docs/`.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after the diagnostics update.

## 401. Window Canvas Browser-Like Presentation Resize

- [x] Change Win32 software-buffer presentation so resizing the native window does not scale the canvas bitmap, fixed CSS lengths, or font pixels.
- [x] Clear exposed native client-area pixels before presenting the 1:1 canvas buffer.
- [x] Add focused generated-output coverage for the non-scaling Win32 present path.
- [x] Document the current browser-like resize rule for `jayess:window` and canvas HTML probes.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after the presentation update.

## 402. Window Canvas Present Flicker Fix

- [x] Stop clearing the full Win32 client area before every 1:1 canvas present.
- [x] Clear only exposed right and bottom strips outside the canvas buffer.
- [x] Add focused generated-output coverage preventing full-client clear before present.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after the flicker fix.

## 403. Window Canvas HTML Responsive Probe

- [x] Update `custom-test/window-canvas-html` CSS to use percentage widths plus min/max constraints while keeping font sizes fixed.
- [x] Recreate the canvas and rerun HTML layout when `jayess:window` emits resize events.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after the responsive probe update.

## 404. Responsive Canvas Fractional Rectangle Fix

- [x] Round clipped canvas rectangle bounds before delegating to native image rectangle fills.
- [x] Add focused generated-output coverage for pixel-aligned canvas rectangle fills.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after the fractional rectangle fix.

## 405. Window Canvas Responsive Resize Coalescing

- [x] Reuse the parsed `window-canvas-html` document across resize relayouts instead of reparsing HTML/CSS for every resize event.
- [x] Coalesce resize event batches to the latest viewport size and throttle responsive repaints during drag resizing.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after resize coalescing.

## 406. Canvas HTML Media Query Slice

- [x] Parse first-slice CSS `@media` blocks with `min-width`, `max-width`, `min-height`, and `max-height` viewport conditions.
- [x] Reapply stylesheet rules during `layoutHtml(document, bounds)` so media queries respond to relayout bounds.
- [x] Update `custom-test/window-canvas-html` to exercise a narrow-width media query.
- [x] Add focused output coverage for media parser and style evaluator helpers.
- [x] Document supported media-query syntax and limitations under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after media query support.

## 407. Canvas CSS Relative Length Units And Calc

- [x] Extend canvas CSS size parsing for `em`, `rem`, `vh`, `vw`, and simple whitespace-separated `calc(...)` addition/subtraction expressions.
- [x] Add a focused CSS length resolver context for current font size, root font size, viewport width, and viewport height.
- [x] Thread length resolution context through HTML layout for widths, heights, min/max constraints, margins, padding, borders, gaps, font size, and line height.
- [x] Let media-query viewport conditions use the same CSS length resolver as ordinary layout lengths.
- [x] Add focused output coverage and fixture coverage for relative length parsing and generated helper emission.
- [x] Update `custom-test/window-canvas-html` to exercise `rem`, `em`, viewport units, and `calc(...)` in responsive CSS.
- [x] Document supported relative units and first-slice `calc(...)` syntax under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` from a clean generated directory after relative length support.

## 408. Canvas CSS Calc Multiplication And Division

- [x] Extend first-slice `calc(...)` parsing to accept whitespace-separated `*` and `/` operators.
- [x] Resolve `calc(...)` multiplication and division left-to-right with a focused division-by-zero diagnostic.
- [x] Update fixture and manual window probe CSS to exercise `calc(...)` multiplication and division.
- [x] Document Jayess canvas `calc(...)` multiplication and division support under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` after the `calc(...)` operator update.

## 409. Canvas HTML Media Font Breakpoint Verification

- [x] Update `custom-test/window-canvas-html` to use explicit `720px` media breakpoints for paragraph and button font sizes.
- [x] Add generated executable assertions that media query relayout changes width, font size, and line height across the breakpoint.
- [x] Document the `min-width: 720px` font-size breakpoint pattern under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` after the media font breakpoint update.

## 410. Canvas HTML Compile-Time Asset Embedding

- [x] Add a focused `transpileFile()` AST transform that embeds static `packHtml()` and `packCss()` calls before semantic analysis.
- [x] Add `jayess:canvas` source-facing pack declarations for `packHtml` and `packCss`.
- [x] Restrict compile-time asset embedding to static relative `.html` and `.css` files inside the project root.
- [x] Move `custom-test/window-canvas-html` HTML and CSS into separate source assets and load them through compile-time loaders.
- [x] Add focused generated-output coverage proving HTML/CSS assets are embedded into generated C++ and not copied to `dist`.
- [x] Document compile-time asset embedding under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` after moving HTML/CSS into source assets.

## 411. Canvas Runtime HTML/CSS Loading

- [x] Add `loadHtml()` and `loadCss()` to `jayess:canvas` for runtime `.html` and `.css` text loading.
- [x] Keep `packHtml()` and `packCss()` as compile-time embedding helpers separate from runtime loaders.
- [x] Add generated executable coverage proving runtime HTML/CSS files are read through `jayess:canvas`.
- [x] Update `custom-test/window-canvas-html` to load source HTML/CSS through explicit runtime calls without polling.
- [x] Document runtime loading versus compile-time packing under `/docs`.
- [x] Rebuild `custom-test/window-canvas-html` after adding runtime HTML/CSS loading.

## 412. GUI HTML Renderer Facade

- [x] Add a focused `jayess:gui/html-renderer` facade that composes `jayess:canvas`, `jayess:window`, `jayess:thread`, and `jayess:time`.
- [x] Provide `htmlRenderer()` and frame helpers for native window creation, canvas creation, caller-provided HTML/CSS strings, layout, painting, presentation, event polling, responsive resize relayout, manual reload, and close handling.
- [x] Keep top-level `jayess:html` string helpers from pulling in `jayess:canvas` or `jayess:window`.
- [x] Update `custom-test/window-canvas-html` to use `htmlRenderer()` instead of manually wiring canvas, window, resize, reload, and event-loop code.
- [x] Support one CSS string or an ordered CSS string array in `htmlRenderer()` options and `reloadHtmlRenderer()`.
- [x] Add focused module-graph, output, and compile coverage for `jayess:gui/html-renderer`.
- [x] Document the renderer facade under `/docs`.
