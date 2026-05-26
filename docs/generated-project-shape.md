# Generated Project Shape

This document describes the current output shape written by `transpileFile(entryFilename, targetDirname, options?)`.

It records the current layout as contributor-facing contract, not a promise of a future build system.

## Core Rules

- `transpileFile()` writes only under `targetDirname`
- generated Jayess modules are emitted as paired `.hpp` and `.cpp` files
- filenames are derived from stable module stems based on the source path relative to the project root
- repository-owned `jayess:*` standard-library modules are emitted under `generated-stdlib/jayess/`
- repeated runs with the same inputs should produce the same generated file contents and file naming

## Module Filename Encoding

Current module stems are derived by:

- taking the module path relative to the project root
- normalizing separators to `/`
- replacing path separators and punctuation with `_`

Examples:

- entry `main.js` relative to the current project root → `main_js`
- `../node_modules/jayess-lib/index.js` → `_node_modules_jayess_lib_index_js`
- `../node_modules/@scope/math/src/index.js` → `_node_modules__scope_math_src_index_js`

This keeps package and scoped-package identity visible without flattening everything to ambiguous short names, while still keeping generated package-module outputs at the target root instead of recreating nested `node_modules/` directory trees inside the generated project.

Repository-owned standard-library modules keep their source identity in the output directory:

- `jayess:string` source `stdlib/jayess/string/index.js` → `generated-stdlib/jayess/string/stdlib_jayess_string_index_js.hpp`
- `jayess:collections/map` source `stdlib/jayess/collections/map/index.js` → `generated-stdlib/jayess/collections/map/stdlib_jayess_collections_map_index_js.cpp`

The generated stem remains encoded for namespace stability, while the directory path keeps the bundled stdlib source location readable.

## Current Output Files

Every generated project currently includes:

- generated module headers such as `main_js.hpp`
- generated module sources such as `main_js.cpp`
- generated standard-library headers and sources under `generated-stdlib/jayess/...` when `jayess:*` modules are imported
- `runtime/jayess_runtime.hpp`
- `runtime/jayess_runtime.cpp`
- `jayess_dependency_plan.json`

When native artifacts are imported, the generated target may also include:

- `native/*.hpp`, `native/*.cpp`, or other copied native headers/sources
- `libraries/*.dll`, `libraries/*.lib`, `libraries/*.so`, `libraries/*.dylib`, or static-library artifacts

Native artifacts are copied under deterministic bucket directories:

- headers and native source files under `native/`
- shared/static library artifacts under `libraries/`

Mixed native imports keep those buckets stable:

- header and native source imports are copied into `native/`
- shared and static library imports are copied into `libraries/`
- generated Jayess module headers and sources still stay at the target root (or under `generated-stdlib/jayess/` for repository stdlib modules)

## Runtime Fragment Selection

`transpileFile()` emits a closed runtime for the generated module graph. The core Jayess value model and module-initialization async handle support are always included. Optional runtime fragments are selected from parsed syntax and imported `jayess:*` modules.

Examples:

- a simple arithmetic module keeps core helpers and omits `jayess:async` composition helpers and generator helpers
- `async function` and `await` include the async core required to create, resolve, reject, and await Jayess async handles
- importing `jayess:async` adds the async composition helpers such as `all`, `race`, `sleep`, and `timeout`
- generator syntax or importing `jayess:iter` adds generator runtime helpers
- importing `jayess:regex` adds regex helpers; importing `jayess:string` also includes regex support because string replacement accepts regex values
- importing `jayess:image` adds one focused image/runtime bridge that covers file I/O, deterministic PPM/PGM bytes helpers, clipped bulk rectangle helpers, and copy-based subimage support without adding extra generated project buckets

Fragment order and fragment dependencies are fixed in source so generated runtime files stay deterministic for the same input graph. Tests that intentionally inspect the complete runtime can request all fragments through the public transpile-file options used by the test harness.

The always-present runtime core is also kept split internally into focused source fragments such as control/exception scaffolding and value/composite helpers. That internal organization does not change the emitted project layout, but it is intended to keep `runtime/jayess_runtime.*` generation deterministic and maintainable as the shipped runtime surface grows.

## Dependency Plan

`jayess_dependency_plan.json` records the closed module graph used by `transpileFile()`.

The plan includes:

- the entry filename
- the project root
- the entry module first, then the remaining modules in stable source-filename order for reviewability
- each source module filename
- each source module kind, such as user/package source or repository stdlib source
- each generated module stem
- each generated header/source output path relative to `targetDirname`
- each dependency source string, kind, resolved filename, source kind, generated output paths, and generated module stem when one exists
- each dependency inclusion reason and any runtime features included by that dependency
- platform adapter requirements for native-backed `jayess:*` modules such as `dialog`, `net`, `window`, `gpu`, `clipboard`, `watch`, and `subprocess`

For `jayess:http`, HTTPS/TLS option validation is recorded through the imported `jayess:http` and `jayess:crypto` modules plus their selected runtime fragments. This validation boundary does not add a mandatory platform TLS library by itself. Generated metadata records `tls-validation` as compiled with HTTP and `host-tls` as the live HTTPS client hook family. A generated project that reaches HTTPS or server `tls` options validates certificate, private-key, trust-anchor, and unsupported ALPN shapes before the runtime reports the normalized unavailable-backend diagnostic when no live host TLS client adapter is registered.

Database support is intentionally not shipped for now. Generated projects do not include `jayess:db`, `jayess:sqlite`, SQLite adapter metadata, or database runtime fragments.

For `jayess:window`, the generated metadata now distinguishes adapter families explicitly rather than treating Linux windowing as one bucket. The current adapter list includes `win32`, `cocoa`, `x11`, and `wayland`.

For `jayess:dialog`, the generated metadata now distinguishes dialog adapter families explicitly too. The current dialog runtime reports:

- `windows: ["win32-dialog"]`
- `macos: ["cocoa-dialog"]`
- `linux: ["linux-portal-dialog"]`

The Linux entry names the focused `xdg-desktop-portal` adapter family boundary and still allows the runtime to report the normalized unavailable-host diagnostic when that host path cannot be used.

Dialog option support is adapter-neutral before host selection. The runtime validates `openFile({ multiple: true })`, normalized `{ name, extensions }` file filters, `saveFile({ defaultName })`, and `message({ detail })` in the shared dialog fragment, then lets the Win32, Cocoa, or Linux portal-family adapter consume the supported subset for that host.

The same metadata now also reports the compiled adapter set by host platform when that matters. For the current window runtime, generated projects report:

- `windows: ["win32"]`
- `macos: ["cocoa"]`
- `linux: ["x11", "wayland"]`

The current Linux selection policy is also recorded in metadata: prefer Wayland when `WAYLAND_DISPLAY` is set and the Wayland client path is available; otherwise fall back to X11 when available.

The window metadata also records the normalized event families compiled into the project: `close`, `resize`, `key`, `text-input`, `pointer`, and `mouse-button`.

That metadata shape now matches the emitted runtime and the executable verification layer: Linux projects compile both adapter families into the guarded runtime, then host-conditional runtime probes verify X11 and Wayland separately where the local host can actually open those adapters. The shared runtime event queue is still adapter-neutral; close, resize, key, text-input, pointer, and mouse-button events use the same public object shapes regardless of the selected adapter.
- `jayess:gpu` now records `validation` alongside the host backend families in generated metadata. `validation` is the deterministic always-available backend used for command execution and executable verification, while `direct3d`, `metal`, `vulkan`, and `opengl` remain explicit host backend families behind guarded adapter files.
- the generated GPU metadata now also reports the currently compiled backend set by platform:
  windows: `["validation", "direct3d"]`
  macos: `["validation", "metal"]`
  linux: `["validation", "opengl", "vulkan"]`
- the generated GPU metadata also records current `createSurface(window)` host selection rules:
  Windows prefers `direct3d`, macOS prefers `metal`, Linux prefers guarded `vulkan` for compatible X11 or Wayland windows, then guarded `opengl` for X11 windows, and other Linux window paths fall back to `validation`
- GPU resource metadata stays inside the generated runtime handles for now. Buffer bytes, shader stage/source metadata, pipeline primitive metadata, and texture pixels do not add new platform metadata families until a host adapter consumes them directly.
- package metadata for package imports, including package name, package root, selected package field, export key, export condition, package array trace metadata, attempted path/extension details for skipped array entries, and main field when applicable
- package condition decision metadata for selected and skipped `exports` / `imports` branches, including missing condition branches and unsupported condition target shapes
- package self-reference metadata uses the same fields as ordinary package imports, with `packageResolutionMode: "self-reference"` plus any selected export key, pattern match, condition decisions, or array trace entries
- native import dependency entries for copied headers, native source files, and shared/static libraries

The file is emitted under `targetDirname` and is deterministic for the same input graph.

## Build Hints

`jayess_build_hints.json` is a deterministic metadata file for external build tooling. It records generated source files, the required `C++17` standard, include directories with rationale, runtime files, copied native artifacts, copied library artifacts, platform adapters, platform library hints, and optional backend requirements. It does not invoke the compiler, select a toolchain, or add workflow files.

Repository-owned standard-library modules copied into `generated-stdlib/jayess/...` are also identified in the module manifest with `sourceKind: "repository-stdlib"` and a `standardLibrarySpecifier` such as `jayess:image` or `jayess:collections/map`. The manifest also includes `copiedStandardLibraryModules` as a compact sorted index for build and packaging tools.

## Shared-Library-Oriented Layout

When `transpileFile(..., { projectKind: "shared-library" })` is used, the generated target also includes:

- `shared-library/jayess_exports.hpp`
- `shared-library/jayess_entry.hpp`
- `shared-library/jayess_entry.cpp`
- `shared-library/jayess_shared_library.json`

The JSON file is intentionally small and acts as the only current manifest-like output for this mode.

## Current Non-Goals

- no build graph, lockfile, or package-manager metadata is generated
- the transpiler does not invoke the compiler or linker itself
- the generated layout is meant for downstream external build tooling
