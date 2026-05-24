import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { JayessError } from "../../src/diagnostics.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

function assertGeneratedStdlibModule(result, targetDir, subpath) {
  const modulePath = generatedStdlibCppPath(targetDir, subpath);
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  return modulePath;
}

function transpileFileWithFullRuntime(fixture, targetDir) {
  return transpileFile(fixture, targetDir, { runtimeFragments: "all" });
}

function normalizeSlashes(text) {
  return text.replace(/\\/g, "/");
}

test("transpileFile surfaces package resolver diagnostics through the public API", (t) => {
  const targetDir = createManagedTempDir(t, "package-diagnostic-output");
  const fixture = path.resolve("test/fixtures/package-project/src/outside-package.js");

  assert.throws(
    () => transpileFile(fixture, targetDir),
    (error) =>
      error instanceof JayessError
      && /points outside its package root/.test(error.diagnostics[0].message)
  );
});

test("transpileFile copies native headers into target", (t) => {
  const targetDir = createManagedTempDir(t, "native-output");
  const fixture = path.resolve("test/fixtures/modules/native-user.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "native", "math.hpp")));
});

test("transpileFile copies native source artifacts into target", (t) => {
  const targetDir = createManagedTempDir(t, "native-source-output");
  const fixture = path.resolve("test/fixtures/modules/native-source-user.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "native", "math.cpp")));
});

test("transpileFile copies shared and static library artifacts into target", (t) => {
  const targetDir = createManagedTempDir(t, "library-artifact-output");
  const fixture = path.resolve("test/fixtures/modules/library-user.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "libraries", "math.dll")));
  assert.ok(fs.existsSync(path.join(targetDir, "libraries", "math.lib")));
  assert.ok(fs.realpathSync(path.join(targetDir, "libraries", "math.dll")).startsWith(fs.realpathSync(targetDir)));
  assert.ok(fs.realpathSync(path.join(targetDir, "libraries", "math.lib")).startsWith(fs.realpathSync(targetDir)));
});

test("transpileFile can write shared-library project layout", (t) => {
  const targetDir = createManagedTempDir(t, "shared-layout-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir, {
    projectKind: "shared-library",
    libraryName: "jayess_demo"
  });

  assert.ok(result.files.some((file) => path.relative(targetDir, file).split(path.sep).join("/") === "shared-library/jayess_exports.hpp"));
  assert.ok(result.files.some((file) => path.relative(targetDir, file).split(path.sep).join("/") === "shared-library/jayess_entry.hpp"));
  assert.ok(result.files.some((file) => path.relative(targetDir, file).split(path.sep).join("/") === "shared-library/jayess_entry.cpp"));
  assert.ok(result.files.some((file) => path.relative(targetDir, file).split(path.sep).join("/") === "shared-library/jayess_shared_library.json"));
  assert.ok(fs.existsSync(path.join(targetDir, "shared-library", "jayess_shared_library.json")));
});

test("transpileFile writes shared-library manifest with stable content", (t) => {
  const targetDir = createManagedTempDir(t, "shared-layout-manifest-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir, {
    projectKind: "shared-library",
    libraryName: "jayess_demo"
  });

  const manifest = JSON.parse(
    fs.readFileSync(path.join(targetDir, "shared-library", "jayess_shared_library.json"), "utf8")
  );

  assert.deepEqual(manifest, {
    kind: "shared-library-project",
    libraryName: "jayess_demo",
    entryHeader: "main_js.hpp",
    entryNamespace: "jayess_module_main_js",
    entryFunction: "jayess_library_entry"
  });
});

test("transpileFile emits multi-module headers with module init declarations", (t) => {
  const targetDir = createManagedTempDir(t, "multi-module-shape");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "main_js.hpp"), "utf8");
  const moduleSource = fs.readFileSync(path.join(targetDir, "main_js.cpp"), "utf8");
  assert.match(headerSource, /jayess::value jayess_module_init\(\);/);
  assert.match(headerSource, /jayess::value jayess_module_init_async\(\);/);
  assert.match(moduleSource, /jayess::value jayess_module_init_async\(\) \{/);
  assert.match(moduleSource, /return jayess::make_resolved_async\(jayess_module_init\(\)\);/);
});

test("transpileFile namespace import project writes generated files", (t) => {
  const targetDir = createManagedTempDir(t, "namespace-output");
  const fixture = path.resolve("test/fixtures/modules/namespace-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("namespace_main_js.cpp")));
});

test("transpileFile encodes package and scoped-package modules into stable filenames", (t) => {
  const targetDir = createManagedTempDir(t, "package-layout-output");
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("main_js.cpp")));
  assert.ok(result.files.some((file) => file.endsWith("_node_modules_jayess_lib_index_js.cpp")));
  assert.ok(result.files.some((file) => file.endsWith("_node_modules__scope_math_src_index_js.cpp")));
});

test("transpileFile writes deterministic dependency metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-output");
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");
  const result = transpileFile(fixture, targetDir);

  const planPath = path.join(targetDir, "jayess_dependency_plan.json");
  assert.ok(result.files.includes(planPath));
  assert.ok(fs.existsSync(planPath));

  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  assert.equal(plan.entryFilename, path.resolve(fixture));
  assert.equal(plan.projectRoot, path.resolve("test/fixtures/package-project/src"));

  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => dependency.source),
    ["jayess-lib", "@scope/math"]
  );
  assert.equal(entry.dependencies[0].kind, "package");
  assert.equal(entry.dependencies[0].packageName, "jayess-lib");
  assert.match(normalizeSlashes(entry.dependencies[0].packageRoot), /node_modules\/jayess-lib$/);
  assert.equal(entry.dependencies[0].packageField, "index");
  assert.equal(entry.dependencies[1].packageName, "@scope/math");
  assert.match(normalizeSlashes(entry.dependencies[1].packageRoot), /node_modules\/@scope\/math$/);
  assert.equal(entry.dependencies[1].packageField, "exports");
  assert.equal(plan.modules[0].sourceFilename, path.resolve(fixture));
  assert.deepEqual(
    plan.modules.slice(1).map((module) => module.sourceFilename),
    [...plan.modules.slice(1).map((module) => module.sourceFilename)].sort((left, right) => left.localeCompare(right))
  );
});

test("transpileFile writes deterministic project manifests", (t) => {
  const targetDir = createManagedTempDir(t, "project-manifest-output");
  const fixture = path.resolve("test/fixtures/package-project/src/package-import-main.js");
  const result = transpileFile(fixture, targetDir);

  const moduleManifestPath = path.join(targetDir, "jayess_module_manifest.json");
  const runtimeFeaturesPath = path.join(targetDir, "jayess_runtime_features.json");
  const dependencyGraphPath = path.join(targetDir, "jayess_dependency_graph.json");
  assert.ok(result.files.includes(moduleManifestPath));
  assert.ok(result.files.includes(runtimeFeaturesPath));
  assert.ok(result.files.includes(dependencyGraphPath));

  const moduleManifest = JSON.parse(fs.readFileSync(moduleManifestPath, "utf8"));
  const runtimeFeatures = JSON.parse(fs.readFileSync(runtimeFeaturesPath, "utf8"));
  const dependencyGraph = JSON.parse(fs.readFileSync(dependencyGraphPath, "utf8"));
  assert.equal(moduleManifest.kind, "jayess-module-manifest");
  assert.equal(runtimeFeatures.kind, "jayess-runtime-features");
  assert.deepEqual(runtimeFeatures.fragments, ["async-core", "class"]);
  assert.equal(dependencyGraph.kind, "jayess-dependency-graph");

  const entry = moduleManifest.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.imports.map((dependency) => ({
      source: dependency.source,
      kind: dependency.kind,
      header: dependency.generatedHeaderPath
    })),
    [
      { source: "#tools", kind: "package-import", header: "self_tools_js.hpp" },
      { source: "#condition", kind: "package-import", header: "self_import_js.hpp" },
      { source: "#features/tools", kind: "package-import", header: "self_tools_js.hpp" }
    ]
  );
});

test("transpileFile writes deterministic build hints metadata", (t) => {
  const targetDir = createManagedTempDir(t, "build-hints-output");
  const fixture = path.resolve("test/fixtures/modules/library-user.js");
  const result = transpileFile(fixture, targetDir, { runtimeFragments: "all" });

  const buildHintsPath = path.join(targetDir, "jayess_build_hints.json");
  assert.ok(result.files.includes(buildHintsPath));

  const hints = JSON.parse(fs.readFileSync(buildHintsPath, "utf8"));
  assert.equal(hints.kind, "jayess-build-hints");
  assert.equal(hints.cxxStandard, "C++17");
  assert.ok(hints.sourceFiles.includes("runtime/jayess_runtime.cpp"));
  assert.ok(hints.sourceFiles.some((file) => file.endsWith("library_user_js.cpp")));
  assert.deepEqual(hints.includeDirectories, [".", "native", "runtime"]);
  assert.deepEqual(hints.includeDirectoryDetails, [
    { directory: ".", rationale: "generated module headers and entry sources" },
    { directory: "native", rationale: "copied native bridge headers" },
    { directory: "runtime", rationale: "Jayess runtime headers" }
  ]);
  assert.ok(hints.runtimeFiles.includes("runtime/jayess_runtime.hpp"));
  assert.ok(hints.nativeArtifacts.includes("native/math.hpp"));
  assert.ok(hints.libraryArtifacts.includes("libraries/math.dll"));
  assert.ok(hints.libraryArtifacts.includes("libraries/math.lib"));
});

test("transpileFile records stdlib runtime reasons and platform adapter metadata", (t) => {
  const targetDir = createManagedTempDir(t, "adapter-metadata-output");
  const fixture = path.resolve("test/fixtures/modules/gpu-main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const hints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_module_manifest.json"), "utf8"));

  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  const gpuDependency = entry.dependencies.find((dependency) => dependency.source === "jayess:gpu");
  const windowDependency = entry.dependencies.find((dependency) => dependency.source === "jayess:window");
  assert.equal(gpuDependency.inclusionReason, "stdlib import 'jayess:gpu' includes runtime feature(s): gpu");
  assert.deepEqual(gpuDependency.runtimeFeatures, ["gpu"]);
  assert.deepEqual(gpuDependency.runtimeRequirements.gpu.adapters, ["validation", "direct3d", "metal", "opengl", "vulkan"]);
  assert.deepEqual(gpuDependency.runtimeRequirements.gpu.compiledAdaptersByPlatform, {
    windows: ["validation", "direct3d"],
    macos: ["validation", "metal"],
    linux: ["validation", "opengl", "vulkan"]
  });
  assert.equal(windowDependency.inclusionReason, "stdlib import 'jayess:window' includes runtime feature(s): window");
  assert.deepEqual(windowDependency.runtimeRequirements.window.adapters, ["win32", "cocoa", "x11", "wayland"]);
  assert.deepEqual(windowDependency.runtimeRequirements.window.platformLibraries, ["gdi32", "user32", "wayland-client", "x11"]);
  assert.deepEqual(windowDependency.runtimeRequirements.window.optionalBackendRequirements, ["Wayland runtime depends on a host compositor that exposes the xdg-shell client protocol"]);
  assert.deepEqual(windowDependency.runtimeRequirements.window.compiledAdaptersByPlatform, {
    windows: ["win32"],
    macos: ["cocoa"],
    linux: ["x11", "wayland"]
  });
  assert.deepEqual(windowDependency.runtimeRequirements.window.adapterSelection, {
    linux: {
      preferredOrder: ["wayland", "x11"],
      defaultBehavior: "Prefer Wayland when WAYLAND_DISPLAY is set and the Wayland client path is available; otherwise fall back to X11 when available."
    }
  });

  assert.deepEqual(
    hints.platformAdapters.map((adapter) => adapter.feature),
    ["gpu", "window"]
  );
  const gpuPlatformAdapter = hints.platformAdapters.find((adapter) => adapter.feature === "gpu");
  assert.deepEqual(gpuPlatformAdapter.compiledAdaptersByPlatform, {
    windows: ["validation", "direct3d"],
    macos: ["validation", "metal"],
    linux: ["validation", "opengl", "vulkan"]
  });
  assert.deepEqual(gpuPlatformAdapter.adapterSelection, {
    windowSurface: {
      windows: "Prefer direct3d for createSurface(window) when the Win32 window adapter is available; otherwise fall back to validation.",
      macos: "Prefer metal for createSurface(window) when the Cocoa window adapter is available; otherwise fall back to validation.",
      linux: "Current createSurface(window) still falls back to validation until the Linux host-backed backend slice lands."
    }
  });
  const windowPlatformAdapter = hints.platformAdapters.find((adapter) => adapter.feature === "window");
  assert.deepEqual(windowPlatformAdapter.compiledAdaptersByPlatform, {
    windows: ["win32"],
    macos: ["cocoa"],
    linux: ["x11", "wayland"]
  });
  assert.deepEqual(windowPlatformAdapter.adapterSelection, {
    linux: {
      preferredOrder: ["wayland", "x11"],
      defaultBehavior: "Prefer Wayland when WAYLAND_DISPLAY is set and the Wayland client path is available; otherwise fall back to X11 when available."
    }
  });
  assert.deepEqual(hints.runtimeRequirements.gpu.optionalBackendRequirements, [
    "validation backend is always available for deterministic command execution",
    "host GPU driver",
    "selected GPU SDK headers"
  ]);
  assert.deepEqual(hints.runtimeRequirements.gpu.compiledAdaptersByPlatform, {
    windows: ["validation", "direct3d"],
    macos: ["validation", "metal"],
    linux: ["validation", "opengl", "vulkan"]
  });
  assert.deepEqual(hints.runtimeRequirements.gpu.adapterSelection, {
    windowSurface: {
      windows: "Prefer direct3d for createSurface(window) when the Win32 window adapter is available; otherwise fall back to validation.",
      macos: "Prefer metal for createSurface(window) when the Cocoa window adapter is available; otherwise fall back to validation.",
      linux: "Current createSurface(window) still falls back to validation until the Linux host-backed backend slice lands."
    }
  });
  assert.deepEqual(hints.runtimeRequirements.window.compiledAdaptersByPlatform, {
    windows: ["win32"],
    macos: ["cocoa"],
    linux: ["x11", "wayland"]
  });
  assert.deepEqual(hints.runtimeRequirements.window.adapterSelection, {
    linux: {
      preferredOrder: ["wayland", "x11"],
      defaultBehavior: "Prefer Wayland when WAYLAND_DISPLAY is set and the Wayland client path is available; otherwise fall back to X11 when available."
    }
  });
  assert.deepEqual(
    hints.platformLibraryHints.map((hint) => hint.feature),
    ["gpu", "window"]
  );

  const stdlibGpu = manifest.modules.find((module) => module.standardLibrarySpecifier === "jayess:gpu");
  assert.ok(stdlibGpu);
  assert.equal(stdlibGpu.sourceKind, "repository-stdlib");
  assert.ok(manifest.copiedStandardLibraryModules.some((module) => module.specifier === "jayess:gpu"));
});

test("transpileFile records platform metadata for native system modules", (t) => {
  const cases = [
    {
      fixture: "test/fixtures/modules/dialog-main.js",
      feature: "dialog",
      adapters: ["win32-dialog", "cocoa-dialog", "linux-portal-dialog"],
      libraries: [],
      compiledAdaptersByPlatform: {
        windows: ["win32-dialog"],
        macos: ["cocoa-dialog"],
        linux: ["linux-portal-dialog"]
      }
    },
    {
      fixture: "test/fixtures/modules/http-main.js",
      feature: "http",
      adapters: ["posix-http", "winsock-http"],
      libraries: ["ws2_32"]
    },
    {
      fixture: "test/fixtures/modules/net-main.js",
      feature: "net",
      adapters: ["posix-sockets", "winsock"],
      libraries: ["ws2_32"]
    },
    {
      fixture: "test/fixtures/modules/watch-main.js",
      feature: "watch",
      adapters: ["inotify", "kqueue", "read-directory-changes"],
      libraries: []
    },
    {
      fixture: "test/fixtures/modules/subprocess-main.js",
      feature: "subprocess",
      adapters: ["posix-process", "windows-process"],
      libraries: []
    }
  ];

  for (const current of cases) {
    const targetDir = createManagedTempDir(t, `platform-${current.feature}-metadata-output`);
    transpileFile(path.resolve(current.fixture), targetDir);

    const hints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));
    const requirement = hints.runtimeRequirements[current.feature];
    assert.ok(requirement, `missing ${current.feature} runtime requirement`);
    assert.deepEqual(requirement.adapters, current.adapters);
    assert.deepEqual(requirement.platformLibraries, current.libraries);
    assert.ok(hints.platformAdapters.some((adapter) => adapter.feature === current.feature));
    if (current.compiledAdaptersByPlatform != null) {
      assert.deepEqual(requirement.compiledAdaptersByPlatform, current.compiledAdaptersByPlatform);
      const platformAdapter = hints.platformAdapters.find((adapter) => adapter.feature === current.feature);
      assert.deepEqual(platformAdapter.compiledAdaptersByPlatform, current.compiledAdaptersByPlatform);
    }

    if (current.libraries.length > 0) {
      assert.ok(hints.platformLibraryHints.some((hint) => hint.feature === current.feature));
    }
  }
});

test("transpileFile records selected package export conditions", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-jayess-condition-output");
  const fixture = path.resolve("test/fixtures/package-project/src/jayess-condition-main.js");
  const result = transpileFile(fixture, targetDir);

  const planPath = path.join(targetDir, "jayess_dependency_plan.json");
  assert.ok(result.files.includes(planPath));

  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => ({
      source: dependency.source,
      key: dependency.packageExportKey,
      condition: dependency.packageExportCondition,
      trace: dependency.packageExportConditionTrace
    })),
    [
      { source: "jayess-condition-lib", key: ".", condition: "jayess", trace: ["jayess"] },
      { source: "jayess-condition-lib/feature", key: "./feature", condition: "jayess", trace: ["jayess"] }
    ]
  );
});

test("transpileFile records default package export condition fallback", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-default-condition-output");
  const fixture = path.resolve("test/fixtures/package-project/src/default-condition-main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.equal(entry.dependencies[0].packageExportKey, ".");
  assert.equal(entry.dependencies[0].packageExportCondition, "default");
  assert.deepEqual(entry.dependencies[0].packageExportConditionTrace, ["jayess", "import", "default"]);
  assert.deepEqual(entry.dependencies[0].packageExportRejectedConditions, []);
  assert.equal(entry.dependencies[0].packageRequestedSubpath, "");
  assert.deepEqual(entry.dependencies[0].packageAllowedExtensions, [".js", ".mjs"]);
});

test("transpileFile records package export array trace metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-export-array-output");
  const fixture = path.resolve("test/fixtures/package-project/src/array-condition-package.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.equal(entry.dependencies[0].packageExportKey, ".");
  assert.deepEqual(
    entry.dependencies[0].packageExportArrayTrace.map((trace) => ({
      index: trace.index,
      kind: trace.kind,
      selected: trace.selected,
      reason: trace.reason,
      condition: trace.condition
    })),
    [
      { index: 0, kind: "number", selected: false, reason: "unsupported", condition: null },
      { index: 1, kind: "conditions", selected: false, reason: "unsupported", condition: null },
      { index: 2, kind: "conditions", selected: true, reason: null, condition: "default" }
    ]
  );
});

test("transpileFile records package self-reference resolution metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-self-reference-output");
  const fixture = path.resolve("test/fixtures/package-project/src/self-reference-condition-main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => ({
      source: dependency.source,
      mode: dependency.packageResolutionMode,
      key: dependency.packageExportKey,
      condition: dependency.packageExportCondition,
      trace: dependency.packageExportConditionTrace
    })),
    [
      {
        source: "package-project/condition",
        mode: "self-reference",
        key: "./condition",
        condition: "import",
        trace: ["jayess", "import"]
      }
    ]
  );
});

test("transpileFile records hoisted workspace package resolution metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-workspace-output");
  const fixture = path.resolve("test/fixtures/workspace-project/packages/app/src/main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => ({
      source: dependency.source,
      mode: dependency.packageResolutionMode,
      key: dependency.packageExportKey,
      field: dependency.packageField,
      root: dependency.packageRoot
    })),
    [
      {
        source: "workspace-lib",
        mode: "node-modules",
        key: ".",
        field: "exports",
        root: path.resolve("test/fixtures/workspace-project/node_modules/workspace-lib")
      },
      {
        source: "workspace-app/self",
        mode: "self-reference",
        key: "./self",
        field: "exports",
        root: path.resolve("test/fixtures/workspace-project/packages/app")
      }
    ]
  );
});

test("transpileFile records package imports resolution metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-package-imports-output");
  const fixture = path.resolve("test/fixtures/package-project/src/package-import-main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies.map((dependency) => ({
      source: dependency.source,
      kind: dependency.kind,
      field: dependency.packageField,
      key: dependency.packageImportKey,
      match: dependency.packageImportPatternMatch,
      condition: dependency.packageImportCondition,
      trace: dependency.packageImportConditionTrace,
      requested: dependency.packageRequestedSubpath,
      extensions: dependency.packageAllowedExtensions
    })),
    [
      { source: "#tools", kind: "package-import", field: "imports", key: "#tools", match: null, condition: null, trace: [], requested: "#tools", extensions: [".js", ".mjs"] },
      { source: "#condition", kind: "package-import", field: "imports", key: "#condition", match: null, condition: "jayess", trace: ["jayess"], requested: "#condition", extensions: [".js", ".mjs"] },
      { source: "#features/tools", kind: "package-import", field: "imports", key: "#features/*", match: "tools", condition: null, trace: [], requested: "#features/tools", extensions: [".js", ".mjs"] }
    ]
  );
});

test("transpileFile records package imports array trace metadata", (t) => {
  const targetDir = createManagedTempDir(t, "dependency-plan-import-array-output");
  const fixture = path.resolve("test/fixtures/package-project/src/package-import-array-main.js");
  transpileFile(fixture, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.equal(entry.dependencies[0].packageImportKey, "#array");
  assert.deepEqual(
    entry.dependencies[0].packageImportArrayTrace.map((trace) => ({
      index: trace.index,
      kind: trace.kind,
      selected: trace.selected,
      reason: trace.reason
    })),
    [
      { index: 0, kind: "string", selected: true, reason: null }
    ]
  );
});

test("transpileFile emits re-export aliases in generated headers", (t) => {
  const targetDir = createManagedTempDir(t, "reexport-output");
  const fixture = path.resolve("test/fixtures/modules/reexport-chain-consumer.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "reexport_chain_js.hpp"), "utf8");
  assert.match(headerSource, /inline auto& total = jayess_module_reexport_named_js::sum;/);
});

test("transpileFile emits export-all aliases in generated headers", (t) => {
  const targetDir = createManagedTempDir(t, "export-all-output");
  const fixture = path.resolve("test/fixtures/modules/export-all-main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "export_all_js.hpp"), "utf8");
  assert.match(headerSource, /inline auto& add = jayess_module_math_js::add;/);
});
