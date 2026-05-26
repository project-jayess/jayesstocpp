import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";
import { JayessError } from "../../src/diagnostics.js";
import { resolvePackageImportDetailed, resolvePackageImportsDetailed } from "../../src/modules/resolve-package-import.js";

test("module graph resolves relative imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph reports missing modules clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/missing.js")),
    (error) => error instanceof JayessError && /Cannot resolve module/.test(error.diagnostics[0].message)
  );
});

test("module graph supports extensionless relative imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/extensionless-main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph deduplicates repeated imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/repeated-main.js"));
  assert.equal(graph.modules.length, 2);
});

test("module graph preserves side effect import order", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/side-effect-main.js"));
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.source),
    ["./setup.js", "./math.js"]
  );
});

test("module graph detects cycles", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/cycle-a.js")),
    (error) => error instanceof JayessError && /Import cycle detected/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves bare and scoped packages", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/main.js"));
  assert.equal(graph.modules.length, 3);
});

test("module graph resolves scoped package subpath imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/scoped-subpath-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageName, "@scope/math");
  assert.ok(graph.modules[1].filename.endsWith("node_modules/@scope/math/feature/index.js"));
});

test("module graph resolves package self-reference imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/self-reference-main.js"));

  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => ({
      source: dependency.source,
      mode: dependency.packageResolutionMode,
      key: dependency.packageExportKey
    })),
    [
      { source: "package-project", mode: "self-reference", key: "." },
      { source: "package-project/feature", mode: "self-reference", key: "./feature" }
    ]
  );
});

test("module graph prefers jayess package export conditions", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/jayess-condition-main.js"));
  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => dependency.packageExportCondition),
    ["jayess", "jayess"]
  );
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.filename.endsWith("jayess-condition-lib/src/jayess.js")));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.filename.endsWith("jayess-condition-lib/src/feature-jayess.js")));
});

test("module graph falls back to default package export conditions", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/default-condition-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageExportCondition, "default");
  assert.ok(graph.modules[1].filename.endsWith("default-condition-lib/src/default.js"));
});

test("module graph preserves direct subpath package resolution without exports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/direct-subpath-main.js"));
  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageField, undefined);
  assert.ok(graph.modules[1].filename.endsWith("direct-subpath-lib/feature/index.js"));
});

test("module graph reports direct subpath fallback trace when package subpaths are missing", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/direct-subpath-missing-main.js")),
    (error) =>
      error instanceof JayessError
      && /package subpath '.\/missing' was not found/.test(error.diagnostics[0].message)
      && /missing\.js/.test(error.diagnostics[0].message)
      && /missing\/index\.js/.test(error.diagnostics[0].message)
  );
});

test("package resolver reports failure trace metadata for missing subpaths", () => {
  const result = resolvePackageImportDetailed(
    path.resolve("test/fixtures/package-project/src/direct-subpath-missing-main.js"),
    "direct-subpath-lib/missing"
  );

  assert.equal(result.reason, "package-subpath-not-found");
  assert.equal(result.requestedSubpath, "missing");
  assert.deepEqual(result.allowedExtensions, [".js", ".mjs"]);
  assert.ok(result.packageResolutionTrace.some((candidate) => candidate.endsWith("missing.js")));
});

test("module graph resolves package export patterns", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/pattern-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageExportKey, "./features/*");
  assert.equal(graph.modules[0].dependencies[0].packageExportPatternMatch, "math");
  assert.equal(graph.modules[0].dependencies[0].packageExportCondition, "jayess");
  assert.ok(graph.modules[1].filename.endsWith("pattern-lib/src/features/math.js"));
});

test("module graph resolves package self-reference export patterns", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/self-reference-pattern-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageResolutionMode, "self-reference");
  assert.equal(graph.modules[0].dependencies[0].packageExportKey, "./features/*");
  assert.equal(graph.modules[0].dependencies[0].packageExportPatternMatch, "tools");
  assert.ok(graph.modules[1].filename.endsWith("package-project/src/self-tools.js"));
});

test("module graph resolves package self-reference imports from nested package files", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/nested/self-reference-nested-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageResolutionMode, "self-reference");
  assert.equal(graph.modules[0].dependencies[0].packageExportKey, "./feature");
  assert.ok(graph.modules[1].filename.endsWith("package-project/src/self-feature.js"));
});

test("module graph resolves package self-reference export arrays with fallback entries", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/nested/self-reference-array-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageResolutionMode, "self-reference");
  assert.equal(graph.modules[0].dependencies[0].packageExportKey, "./array");
  assert.deepEqual(
    graph.modules[0].dependencies[0].packageExportArrayTrace.map((entry) => ({
      index: entry.index,
      kind: entry.kind,
      selected: entry.selected,
      reason: entry.reason
    })),
    [
      { index: 0, kind: "string", selected: false, reason: "missing" },
      { index: 1, kind: "string", selected: true, reason: null }
    ]
  );
  assert.ok(graph.modules[1].filename.endsWith("package-project/src/self-tools.js"));
});

test("module graph rejects unsupported package self-reference condition maps clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/nested/self-reference-unsupported-condition-main.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json exports mapping/.test(error.diagnostics[0].message)
      && /checked conditions 'jayess', 'import', 'default'/.test(error.diagnostics[0].message)
      && /package-project/.test(error.diagnostics[0].message)
      && /unsupported-condition/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves package imports mappings from nested package files", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/nested/package-import-nested-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].kind, "package-import");
  assert.equal(graph.modules[0].dependencies[0].packageImportKey, "#condition");
  assert.equal(graph.modules[0].dependencies[0].packageImportCondition, "jayess");
  assert.ok(graph.modules[1].filename.endsWith("package-project/src/self-import.js"));
});

test("module graph rejects missing package self-reference pattern targets clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/nested/self-reference-pattern-missing-main.js")),
    (error) =>
      error instanceof JayessError
      && /package export target/.test(error.diagnostics[0].message)
      && /self-missing\.js/.test(error.diagnostics[0].message)
      && /package-project/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves hoisted workspace package imports from a nested package", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/workspace-project/packages/app/src/main.js"));
  const moduleFilenames = graph.modules.map((moduleRecord) => moduleRecord.filename.split(path.sep).join("/"));

  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => ({
      source: dependency.source,
      mode: dependency.packageResolutionMode,
      key: dependency.packageExportKey
    })),
    [
      { source: "workspace-lib", mode: "node-modules", key: "." },
      { source: "workspace-app/self", mode: "self-reference", key: "./self" }
    ]
  );
  assert.ok(moduleFilenames.some((filename) => filename.endsWith("workspace-project/node_modules/workspace-lib/src/index.js")));
  assert.ok(moduleFilenames.some((filename) => filename.endsWith("workspace-project/packages/app/src/self.js")));
});

test("module graph resolves workspace self-reference imports from a deeper nested package file", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/workspace-project/packages/app/src/nested/deep/self-reference-main.js"));
  const moduleFilenames = graph.modules.map((moduleRecord) => moduleRecord.filename.split(path.sep).join("/"));

  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => ({
      source: dependency.source,
      mode: dependency.packageResolutionMode,
      key: dependency.packageExportKey
    })),
    [
      { source: "workspace-app/self", mode: "self-reference", key: "./self" },
      { source: "workspace-lib", mode: "node-modules", key: "." }
    ]
  );
  assert.ok(moduleFilenames.some((filename) => filename.endsWith("workspace-project/packages/app/src/self.js")));
  assert.ok(moduleFilenames.some((filename) => filename.endsWith("workspace-project/node_modules/workspace-lib/src/index.js")));
});

test("module graph records unsupported package export array entries before supported Jayess targets", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/mixed-target-main.js"));
  const dependency = graph.modules[0].dependencies[0];

  assert.equal(dependency.source, "mixed-target-lib");
  assert.equal(dependency.packageExportArrayTrace[0].reason, "unsupported-file-type");
  assert.equal(dependency.packageExportArrayTrace[0].attemptedExtension, ".cjs");
  assert.equal(dependency.packageExportArrayTrace[1].selected, true);
});

test("module graph resolves package imports mappings", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-main.js"));

  assert.equal(graph.modules.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies.map((dependency) => ({
      source: dependency.source,
      kind: dependency.kind,
      mode: dependency.packageResolutionMode,
      key: dependency.packageImportKey,
      match: dependency.packageImportPatternMatch,
      condition: dependency.packageImportCondition
    })),
    [
      { source: "#tools", kind: "package-import", mode: "package-import", key: "#tools", match: null, condition: null },
      { source: "#condition", kind: "package-import", mode: "package-import", key: "#condition", match: null, condition: "jayess" },
      { source: "#features/tools", kind: "package-import", mode: "package-import", key: "#features/*", match: "tools", condition: null }
    ]
  );
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.filename.endsWith("package-project/src/self-tools.js")));
  assert.ok(graph.modules.some((moduleRecord) => moduleRecord.filename.endsWith("package-project/src/self-import.js")));
});

test("module graph rejects package imports outside the package root", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-outside-main.js")),
    (error) =>
      error instanceof JayessError
      && /points outside its package root/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects missing package imports targets", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-missing-main.js")),
    (error) =>
      error instanceof JayessError
      && /imports target/.test(error.diagnostics[0].message)
  );
});

test("package resolver reports failed imports pattern metadata", () => {
  const result = resolvePackageImportsDetailed(
    path.resolve("test/fixtures/package-project/src/package-import-missing-main.js"),
    "#missing"
  );

  assert.equal(result.reason, "package-import-target-missing");
  assert.equal(result.packageField, "imports");
  assert.equal(result.requestedSubpath, "#missing");
  assert.deepEqual(result.allowedExtensions, [".js", ".mjs"]);
  assert.ok(result.attemptedPath.endsWith("missing.js"));
});

test("module graph rejects package export patterns outside the package root", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/pattern-outside-main.js")),
    (error) =>
      error instanceof JayessError
      && /points outside its package root/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects missing package export pattern targets", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/pattern-missing-main.js")),
    (error) =>
      error instanceof JayessError
      && /does not exist/.test(error.diagnostics[0].message)
  );
});

test("package resolver reports failed exports pattern metadata", () => {
  const result = resolvePackageImportDetailed(
    path.resolve("test/fixtures/package-project/src/pattern-missing-main.js"),
    "pattern-lib/features/missing"
  );

  assert.equal(result.reason, "package-export-target-missing");
  assert.equal(result.packageField, "exports");
  assert.equal(result.exportKey, "./features/*");
  assert.equal(result.exportPatternMatch, "missing");
  assert.equal(result.requestedSubpath, "features/missing");
  assert.deepEqual(result.allowedExtensions, [".js", ".mjs"]);
});

test("module graph rejects missing packages clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-package.js")),
    (error) => error instanceof JayessError && /package 'missing-lib' was not found in node_modules/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects package targets that are not Jayess source files", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/bad-file-type.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported file type '.json'/.test(error.diagnostics[0].message)
      && /package\.json main entry 'data\.json'/.test(error.diagnostics[0].message)
      && /at '.*data\.json'/.test(error.diagnostics[0].message)
      && /package root/.test(error.diagnostics[0].message)
      && /not a transpileable Jayess package/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects Node built-in imports clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/node-builtin-main.js")),
    (error) =>
      error instanceof JayessError
      && /does not support Node built-in modules inside source imports: 'node:fs'/.test(error.diagnostics[0].message)
      && /jayess:fs/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects packages with missing entry files clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-entry-package.js")),
    (error) =>
      error instanceof JayessError
      && /has no transpileable entry file/.test(error.diagnostics[0].message)
      && /not a transpileable Jayess package/.test(error.diagnostics[0].message)
      && /package.json/.test(error.diagnostics[0].message)
      && /package root/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects package entries that point outside the package root", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/outside-package.js")),
    (error) =>
      error instanceof JayessError
      && /points outside its package root/.test(error.diagnostics[0].message)
      && /outside-lib/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects jayess condition targets outside the package root", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/outside-jayess-condition.js")),
    (error) =>
      error instanceof JayessError
      && /points outside its package root/.test(error.diagnostics[0].message)
      && /outside-jayess-condition-lib/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects unsupported package self-reference targets clearly", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/self-reference-missing.js")),
    (error) =>
      error instanceof JayessError
      && /package export target/.test(error.diagnostics[0].message)
      && /self-missing\.js/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects imports of missing exported names", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/bad-import-name.js")),
    (error) => error instanceof JayessError && /does not export 'missing'/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects re-exports of missing exported names", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/bad-reexport-name.js")),
    (error) => error instanceof JayessError && /does not export 'missing'/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves export-all surfaces for downstream imports", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/export-all-main.js"));
  assert.equal(graph.modules.length, 3);
});

test("module graph resolves mixed named re-export and export-all graphs", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/mixed-reexport-main.js"));
  assert.equal(graph.modules.length, 4);
});

test("module graph keeps export-all from forwarding default exports", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/modules/export-all-default-main.js")),
    (error) => error instanceof JayessError && /does not export 'default'/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects packages that expose only unsupported conditional exports", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/conditional-only-package.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json exports mapping/.test(error.diagnostics[0].message)
      && /checked conditions 'jayess', 'import', 'default'/.test(error.diagnostics[0].message)
      && /conditional-only-lib/.test(error.diagnostics[0].message)
  );
});

test("package resolver reports rejected condition metadata", () => {
  const result = resolvePackageImportDetailed(
    path.resolve("test/fixtures/package-project/src/conditional-only-package.js"),
    "conditional-only-lib"
  );

  assert.equal(result.reason, "package-export-unsupported");
  assert.equal(result.exportKey, ".");
  assert.equal(result.packageUnsupportedReason, "unsupported-conditions");
  assert.deepEqual(result.exportConditionTrace, ["jayess", "import", "default"]);
  assert.deepEqual(result.allowedExtensions, [".js", ".mjs"]);
});

test("module graph resolves package export target arrays", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/array-target-package.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageExportKey, ".");
  assert.equal(graph.modules[0].dependencies[0].packageExportArrayTrace[0].selected, true);
  assert.ok(graph.modules[1].filename.endsWith("array-target-lib/index.js"));
});

test("module graph resolves package export arrays with condition objects", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/array-condition-package.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageExportArrayTrace.length, 3);
  assert.deepEqual(
    graph.modules[0].dependencies[0].packageExportArrayTrace.map((entry) => ({
      index: entry.index,
      kind: entry.kind,
      selected: entry.selected,
      reason: entry.reason,
      condition: entry.condition
    })),
    [
      { index: 0, kind: "number", selected: false, reason: "unsupported", condition: null },
      { index: 1, kind: "conditions", selected: false, reason: "unsupported", condition: null },
      { index: 2, kind: "conditions", selected: true, reason: null, condition: "default" }
    ]
  );
  assert.ok(graph.modules[1].filename.endsWith("array-condition-lib/src/default.js"));
});

test("module graph rejects package export arrays without supported transpileable targets", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/array-empty-package.js")),
    (error) =>
      error instanceof JayessError
      && /exports array contains no supported transpileable target/.test(error.diagnostics[0].message)
      && /entry 0 number unsupported/.test(error.diagnostics[0].message)
      && /entry 1 conditions unsupported checked jayess:missing, import:missing, default:missing/.test(error.diagnostics[0].message)
      && /entry 2 string missing/.test(error.diagnostics[0].message)
      && /array-empty-lib/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects invalid package export target value types", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/invalid-target-package.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json exports mapping/.test(error.diagnostics[0].message)
      && /selected target value type 'number'/.test(error.diagnostics[0].message)
      && /invalid-target-lib/.test(error.diagnostics[0].message)
  );
});

test("module graph resolves package import target arrays", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-array-main.js"));

  assert.equal(graph.modules.length, 2);
  assert.equal(graph.modules[0].dependencies[0].packageImportKey, "#array");
  assert.equal(graph.modules[0].dependencies[0].packageImportArrayTrace[0].selected, true);
});

test("module graph rejects package import arrays without supported transpileable targets", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-array-invalid-main.js")),
    (error) =>
      error instanceof JayessError
      && /imports array contains no supported transpileable target/.test(error.diagnostics[0].message)
      && /entry 0 number unsupported/.test(error.diagnostics[0].message)
      && /entry 1 conditions unsupported checked jayess:missing, import:missing, default:missing/.test(error.diagnostics[0].message)
      && /entry 2 string missing/.test(error.diagnostics[0].message)
      && /#arrayInvalid/.test(error.diagnostics[0].message)
  );
});

test("module graph rejects invalid package import target value types", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/package-import-invalid-main.js")),
    (error) =>
      error instanceof JayessError
      && /unsupported package\.json imports mapping/.test(error.diagnostics[0].message)
      && /#invalid/.test(error.diagnostics[0].message)
  );
});

test("module graph accepts import and export clauses with trailing commas", () => {
  const graph = buildModuleGraph(path.resolve("test/fixtures/modules/trailing-commas-main.js"));
  assert.equal(graph.modules.length, 2);
});
