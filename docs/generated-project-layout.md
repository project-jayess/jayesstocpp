# Generated Project Layout

`transpileFile(entry, targetDir)` writes a focused C++ project under `targetDir`.

| Path | Contents |
| --- | --- |
| `runtime/jayess_runtime.hpp` | Runtime declarations selected from used runtime primitive families. |
| `runtime/jayess_runtime.cpp` | Runtime implementation selected from used runtime primitive families. |
| `<module-stem>.hpp` | Generated header for a Jayess source module. |
| `<module-stem>.cpp` | Generated implementation for a Jayess source module. |
| `generated-stdlib/jayess/...` | Transpiled Jayess standard-library modules imported by user code. |
| `native/` | Copied native headers and sources imported by Jayess modules. |
| `libraries/` | Copied static or shared libraries imported by Jayess modules. |
| `jayess_dependency_plan.json` | Module graph, dependency resolution, generated paths, and package-resolution metadata. |
| `jayess_module_manifest.json` | Deterministic map from each Jayess source module and import specifier to generated C++ header/source paths. |
| `jayess_runtime_features.json` | Deterministic list of runtime primitive fragments included in the generated project. |
| `jayess_dependency_graph.json` | Compact dependency graph summary for tooling that only needs module edges. |
| `jayess_build_hints.json` | Deterministic metadata for external build tooling: source files, include directories, runtime files, native artifacts, and library artifacts. |

When `projectKind: "shared-library"` is used, the output also includes shared-library entry layout files for the selected library name.

The dependency plan is the detailed audit file. It includes package condition traces, package condition decision metadata, package array traces for supported `exports` and `imports` arrays, attempted path/extension metadata for skipped package-array entries, self-reference package resolution mode, inclusion reasons for each dependency edge, selected `jayess:*` runtime features, and platform adapter requirements for native-backed modules such as `jayess:dialog`, `jayess:net`, `jayess:window`, `jayess:gpu`, `jayess:clipboard`, `jayess:watch`, and `jayess:subprocess`. `jayess:http` HTTPS/TLS option validation does not add mandatory platform TLS libraries by itself; generated metadata records the imported `jayess:http` and `jayess:crypto` modules, selected runtime fragments, the always-compiled `tls-validation` family, and the compiled `host-tls` client hook requirement, which reports the unavailable-backend diagnostic until a host implementation is registered. Database support is intentionally not shipped for now, so generated projects do not include `jayess:db`, `jayess:sqlite`, SQLite adapter metadata, or database runtime fragments. For `jayess:window`, that metadata now distinguishes `win32`, `cocoa`, `x11`, and `wayland` as separate adapter families, reports the compiled adapter set per host platform, records the normalized close, resize, key, text-input, pointer, and mouse-button event families, records the current Linux selection order between Wayland and X11, and matches the guarded executable verification layout used by the local runtime probes for those event shapes. For `jayess:dialog`, the current metadata reports `win32-dialog`, `cocoa-dialog`, and `linux-portal-dialog` as separate adapter families for the host-backed file picker and message-box runtime; dialog option validation covers multi-select open-file requests, file filters, save default names, and message detail text before adapter selection. The Linux entry names the focused `xdg-desktop-portal` path and still permits the runtime to return the normalized unavailable-host diagnostic when that host path cannot be used. For `jayess:gpu`, the metadata reports the first host-backed compiled backend sets too: Windows compiles `validation` plus `direct3d`, macOS compiles `validation` plus `metal`, Linux compiles `validation` plus `opengl` / `vulkan`, and the current `createSurface(window)` selection rule records Linux Vulkan selection for compatible X11 or Wayland windows when the guarded runtime can load and probe Vulkan, then Linux OpenGL selection for X11-backed windows when the guarded runtime can load the required OpenGL functions. GPU buffer bytes, shader descriptors, pipeline descriptors, and texture pixels remain deterministic runtime-handle metadata and do not add new generated platform adapter families by themselves. The manifest files are smaller stable indexes intended for build tooling, packaging, and review:

- `jayess_module_manifest.json` lists source filenames, module stems, namespaces, generated paths, standard-library specifiers for `generated-stdlib` modules, and resolved import edges.
- `jayess_runtime_features.json` lists the final runtime fragments after required runtime dependencies have been added.
- `jayess_dependency_graph.json` lists each module and its direct dependency edges without package-resolution detail.
- `jayess_build_hints.json` lists generated `.cpp` files, the required C++ standard, include directories with rationale, runtime support files, copied native files, copied library files, platform adapters, platform library hints, and optional backend requirements. It is metadata only; the transpiler still does not invoke a compiler or linker.

Tests and temporary generated projects should use the repository-managed `temp/` directory, especially `temp/test-output/`.
