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

The dependency plan is the detailed audit file. It includes package condition traces, package array traces for supported `exports` and `imports` arrays, inclusion reasons for each dependency edge, selected `jayess:*` runtime features, and platform adapter requirements for native-backed modules such as `jayess:net`, `jayess:window`, `jayess:gpu`, `jayess:clipboard`, `jayess:watch`, and `jayess:subprocess`. The manifest files are smaller stable indexes intended for build tooling, packaging, and review:

- `jayess_module_manifest.json` lists source filenames, module stems, namespaces, generated paths, standard-library specifiers for `generated-stdlib` modules, and resolved import edges.
- `jayess_runtime_features.json` lists the final runtime fragments after required runtime dependencies have been added.
- `jayess_dependency_graph.json` lists each module and its direct dependency edges without package-resolution detail.
- `jayess_build_hints.json` lists generated `.cpp` files, the required C++ standard, include directories with rationale, runtime support files, copied native files, copied library files, platform adapters, platform library hints, and optional backend requirements. It is metadata only; the transpiler still does not invoke a compiler or linker.

Tests and temporary generated projects should use the repository-managed `temp/` directory, especially `temp/test-output/`.
