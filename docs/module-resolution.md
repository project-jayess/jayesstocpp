# Module Resolution

Jayess resolves source modules during transpilation. Generated projects use a closed module graph; they do not load Jayess source modules at runtime.

## Package Imports

Package imports resolve from `node_modules` starting at the importing file directory and walking upward. Resolved package targets must be Jayess source files supported by the transpiler.

That upward `node_modules` walk means Jayess can resolve the common hoisted dependency shape used by local workspace or monorepo layouts, as long as those layouts still present ordinary ancestor `node_modules` directories. Jayess does not add a separate workspace protocol or package-manager-specific resolver layer.

When the importing file is inside a package whose `package.json` `name` matches the imported package name, Jayess resolves that import as a package self-reference before checking `node_modules`. Self-reference imports use the same `exports`, direct subpath, `main`, and `index.js` rules as ordinary package imports, and they still must resolve to files inside the package root.

Jayess supports a focused package entry surface:

- package root `exports` string targets
- package export map entries for `"."` and explicit subpaths such as `"./feature"`
- package export pattern entries such as `"./features/*"`
- conditional package export objects using `"jayess"`, `"import"`, or `"default"`
- package export arrays whose entries are direct string targets or supported conditional objects
- package `main` fallback, then `index.js`, when `exports` does not resolve the import
- direct package subpath files when a package has no matching `exports` target

When a conditional export object is used, Jayess selects conditions in this order:

1. `"jayess"`
2. `"import"`
3. `"default"`

The selected condition is recorded in `jayess_dependency_plan.json` as `packageExportCondition`. The deterministic condition order checked for that branch is recorded as `packageExportConditionTrace`, and self-reference imports record `packageResolutionMode: "self-reference"`.

Dependency-plan entries also record `packageRequestedSubpath` and `packageAllowedExtensions` so generated project metadata can explain which source subpath was requested and which Jayess source extensions were accepted.

When a package export pattern is used, the selected pattern key is recorded as `packageExportKey`, and the wildcard replacement text is recorded as `packageExportPatternMatch`.

When a package export array is used, Jayess checks entries in source order and selects the first entry that resolves to a supported Jayess source file inside the package root. Skipped entries are recorded in `packageExportArrayTrace` with the entry index, entry kind, selected condition metadata when available, attempted path, and skip reason.

For `transpileFile()` output layout, package and scoped-package modules do not create nested `node_modules/` directories in the generated target. Their resolved source identity is instead encoded into stable root-level generated filenames such as `_node_modules_jayess_lib_index_js.cpp` or `_node_modules__scope_math_src_index_js.hpp`.

## Package Private Imports

Jayess supports static package-private import specifiers that start with `#`, such as `#tools` or `#features/math`. These resolve from the nearest enclosing `package.json` `"imports"` map during transpilation.

The supported `"imports"` surface matches the focused package export surface:

- direct string targets such as `"#tools": "./src/tools.js"`
- pattern targets such as `"#features/*": "./src/features/*.js"`
- conditional objects using `"jayess"`, `"import"`, or `"default"`
- arrays whose entries are direct string targets or supported conditional objects

Package-private imports are recorded in `jayess_dependency_plan.json` with `kind: "package-import"`, `packageField: "imports"`, `packageImportKey`, `packageImportPatternMatch`, `packageImportCondition`, and `packageImportConditionTrace`.

Package-private import entries also record `packageRequestedSubpath`, `packageAllowedExtensions`, rejected conditional-branch metadata where a conditional map is inspected, and `packageImportArrayTrace` when an array mapping is used.

Jayess still rejects dynamic `import()` and runtime-computed package specifiers. Module specifiers must be static import declaration strings so the generated C++ project keeps a closed module graph.

## Boundaries

Package export and package-private import targets must remain inside the package root. Targets that point outside the package fail with a focused diagnostic.

Jayess does not implement full Node conditional exports. Unsupported condition-only maps, arrays with no supported transpileable target, missing export targets, missing self-reference targets, missing packages, and unsupported target file extensions fail during module graph construction.

When an installed package exists but resolves to non-Jayess targets such as JSON, CommonJS-only files, or other unsupported entry kinds, Jayess reports that package as installed but not a transpileable Jayess package rather than treating it as a missing dependency.

Unsupported package export-map diagnostics also explain why the mapping is unsupported when that information is available, such as:

- which conditions were checked for a conditional export object
- whether an export array had no supported transpileable target
- whether a target used an unsupported value type

Failure diagnostics and detailed resolver payloads include the package root, requested subpath, attempted path when a target was selected, supported Jayess source extensions, condition trace, pattern key, and wildcard match where those values are available. Dynamic import and runtime source-module loading remain rejected by the parser and semantic checks because Jayess keeps module closure static.

Native header, native source, shared-library, and static-library imports are not resolved as Jayess source modules. They are validated separately during `transpileFile()` packaging:

- missing native headers fail as missing header artifacts
- missing native sources fail as missing source artifacts
- missing shared or static libraries fail as missing library artifacts
- binding imports from native source or library artifacts are rejected semantically and must come from the matching header import instead

`transpile()` stays intentionally conservative in string-only mode. Repository-owned built-in `jayess:*` modules are resolved through `transpileFile()` and the closed module graph; `transpile()` rejects those imports by default with explicit guidance to use `transpileFile()` or provide explicit resolver support.
