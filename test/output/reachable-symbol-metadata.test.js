import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function dependencyPlanFor(t, fixture, tempName) {
  const targetDir = createManagedTempDir(t, tempName);
  transpileFile(path.resolve(fixture), targetDir);
  return {
    targetDir,
    plan: JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"))
  };
}

function modulePlan(plan, fixture) {
  return plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
}

function dependency(module, source) {
  return module.dependencies.find((entry) => entry.source === source);
}

test("dependency plan records named import-list reachability metadata", (t) => {
  const fixture = "test/fixtures/modules/graph-main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-graph-metadata");
  const entry = modulePlan(plan, fixture);

  const reexport = dependency(entry, "./graph-reexport.js");
  assert.equal(reexport.importForm, "named-import-list");
  assert.deepEqual(reexport.requestedImportNames, ["extra", "plus", "renamed"]);
  assert.equal(reexport.wholeModuleReason, null);
  assert.deepEqual(
    reexport.reachableExports.map((exportRecord) => ({
      exportedName: exportRecord.exportedName,
      localName: exportRecord.localName,
      exportKind: exportRecord.exportKind,
      origin: path.basename(exportRecord.originFilename)
    })),
    [
      { exportedName: "extra", localName: "extra", exportKind: "const", origin: "graph-extra.js" },
      { exportedName: "plus", localName: "plus", exportKind: "re-export", origin: "graph-values.js" },
      { exportedName: "renamed", localName: "value", exportKind: "re-export", origin: "graph-values.js" }
    ]
  );

  const number = dependency(entry, "jayess:number");
  assert.equal(number.importForm, "named-import-list");
  assert.deepEqual(number.requestedImportNames, ["parseInt"]);
  assert.deepEqual(number.reachableExports.map((entry) => entry.exportedName), ["parseInt"]);

  const reachability = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_reachability.json"), "utf8"));
  assert.equal(reachability.kind, "jayess-reachable-symbols");
  const numberModule = reachability.modules.find((module) => module.standardLibrarySpecifier === "jayess:number");
  assert.ok(numberModule);
  assert.deepEqual(numberModule.reachableExports, ["parseInt"]);
  assert.ok(numberModule.retainedExports.includes("parseInt"));
  assert.ok(numberModule.prunedExports.includes("parseFloat"));
});

test("dependency plan records package named import-list reachability metadata", (t) => {
  const fixture = "test/fixtures/package-project/src/main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-package-metadata");
  const entry = modulePlan(plan, fixture);

  const packageDependency = dependency(entry, "jayess-lib");
  assert.equal(packageDependency.kind, "package");
  assert.equal(packageDependency.importForm, "named-import-list");
  assert.deepEqual(packageDependency.requestedImportNames, ["add"]);
  assert.equal(packageDependency.wholeModuleReason, null);
  assert.deepEqual(packageDependency.reachableExports.map((exportRecord) => exportRecord.exportedName), ["add"]);

  const packagePlan = plan.modules.find((module) => module.sourceFilename?.endsWith(path.join("node_modules", "jayess-lib", "index.js")));
  const packageCpp = fs.readFileSync(path.join(targetDir, packagePlan.generatedSourcePath), "utf8");
  assert.match(packageCpp, /add/);
  assert.doesNotMatch(packageCpp, /unused/);
});

test("reachability metadata records declaration references for imported helpers", (t) => {
  const fixture = "test/fixtures/modules/reachable-helper-main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-helper-metadata");
  const entry = modulePlan(plan, fixture);
  const helperDependency = dependency(entry, "./reachable-helper-lib.js");
  assert.equal(helperDependency.importForm, "named-import-list");
  assert.deepEqual(helperDependency.requestedImportNames, ["run"]);

  const reachability = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_reachability.json"), "utf8"));
  const helperModule = reachability.modules.find((module) => module.sourceFilename === path.resolve("test/fixtures/modules/reachable-helper-lib.js"));
  assert.ok(helperModule);
  assert.deepEqual(helperModule.reachableExports, ["run"]);
  assert.deepEqual(helperModule.retainedExports, ["run"]);
  assert.deepEqual(helperModule.prunedExports, ["unused"]);
  assert.deepEqual(helperModule.retainedLocalDeclarations, ["double", "run"]);
  assert.deepEqual(helperModule.retainedImportLocals, ["extra"]);
  assert.deepEqual(
    helperModule.declarationReferences.map((entry) => ({
      name: entry.name,
      localReferences: entry.localReferences,
      importReferences: entry.importReferences
    })),
    [
      { name: "double", localReferences: [], importReferences: [] },
      { name: "run", localReferences: ["double"], importReferences: ["extra"] },
      { name: "unused", localReferences: [], importReferences: [] }
    ]
  );

  const helperPlan = modulePlan(plan, "test/fixtures/modules/reachable-helper-lib.js");
  const helperCpp = fs.readFileSync(path.join(targetDir, helperPlan.generatedSourcePath), "utf8");
  const helperHeader = fs.readFileSync(path.join(targetDir, helperPlan.generatedHeaderPath), "utf8");
  assert.match(helperCpp, /double/);
  assert.match(helperCpp, /run/);
  assert.doesNotMatch(helperCpp, /unused/);
  assert.doesNotMatch(helperHeader, /unused/);
});

test("dependency plan records whole-module reasons for non-named import forms", (t) => {
  const { plan: defaultPlan } = dependencyPlanFor(t, "test/fixtures/modules/default-import-main.js", "reachable-symbol-default-metadata");
  const defaultEntry = modulePlan(defaultPlan, "test/fixtures/modules/default-import-main.js");
  const defaultDependency = dependency(defaultEntry, "./default-value.js");
  assert.equal(defaultDependency.importForm, "default");
  assert.equal(defaultDependency.wholeModuleReason, "default-import");
  assert.deepEqual(defaultDependency.requestedImportNames, []);

  const { plan: namespacePlan } = dependencyPlanFor(t, "test/fixtures/modules/namespace-main.js", "reachable-symbol-namespace-metadata");
  const namespaceEntry = modulePlan(namespacePlan, "test/fixtures/modules/namespace-main.js");
  const namespaceDependency = dependency(namespaceEntry, "./math.js");
  assert.equal(namespaceDependency.importForm, "namespace-or-mixed");
  assert.equal(namespaceDependency.wholeModuleReason, "namespace-or-mixed-import");
  assert.deepEqual(namespaceDependency.requestedImportNames, []);

  const { plan: sideEffectPlan } = dependencyPlanFor(t, "test/fixtures/modules/reachable-side-effect-main.js", "reachable-symbol-side-effect-metadata");
  const sideEffectEntry = modulePlan(sideEffectPlan, "test/fixtures/modules/reachable-side-effect-main.js");
  const sideEffectDependency = dependency(sideEffectEntry, "./reachable-side-effect-setup.js");
  assert.equal(sideEffectDependency.importForm, "side-effect");
  assert.equal(sideEffectDependency.wholeModuleReason, "side-effect-import");
  assert.deepEqual(sideEffectDependency.requestedImportNames, []);

  const { targetDir: mixedTargetDir, plan: mixedPlan } = dependencyPlanFor(t, "test/fixtures/modules/reachable-mixed-main.js", "reachable-symbol-mixed-metadata");
  const mixedEntry = modulePlan(mixedPlan, "test/fixtures/modules/reachable-mixed-main.js");
  const mixedDependency = dependency(mixedEntry, "./reachable-mixed-lib.js");
  assert.equal(mixedDependency.importForm, "default-or-mixed");
  assert.equal(mixedDependency.wholeModuleReason, "mixed-default-import");
  assert.deepEqual(mixedDependency.requestedImportNames, []);

  const mixedLibPlan = modulePlan(mixedPlan, "test/fixtures/modules/reachable-mixed-lib.js");
  const mixedLibCpp = fs.readFileSync(path.join(mixedTargetDir, mixedLibPlan.generatedSourcePath), "utf8");
  assert.match(mixedLibCpp, /unused/);
});

test("reachability metadata records analyzer whole-module fallback reasons", (t) => {
  const { targetDir: sideEffectTargetDir, plan: sideEffectPlan } = dependencyPlanFor(t, "test/fixtures/modules/reachable-top-effect-main.js", "reachable-symbol-top-effect-metadata");
  const sideEffectModule = modulePlan(sideEffectPlan, "test/fixtures/modules/reachable-top-effect-lib.js");
  assert.deepEqual(sideEffectModule.reachability.wholeModuleReasons, ["top-level-side-effect"]);
  assert.deepEqual(sideEffectModule.reachability.prunedExports, []);

  const sideEffectCpp = fs.readFileSync(path.join(sideEffectTargetDir, sideEffectModule.generatedSourcePath), "utf8");
  assert.match(sideEffectCpp, /unused/);

  const { targetDir: ambiguousTargetDir, plan: ambiguousPlan } = dependencyPlanFor(t, "test/fixtures/modules/reachable-ambiguous-main.js", "reachable-symbol-ambiguous-metadata");
  const ambiguousModule = modulePlan(ambiguousPlan, "test/fixtures/modules/reachable-ambiguous-barrel.js");
  assert.deepEqual(ambiguousModule.reachability.wholeModuleReasons, ["ambiguous-export-all"]);
  assert.deepEqual(ambiguousModule.reachability.prunedExports, []);

  const ambiguousCpp = fs.readFileSync(path.join(ambiguousTargetDir, ambiguousModule.generatedSourcePath), "utf8");
  assert.match(ambiguousCpp, /jayess_module_init/);
});

test("runtime fragment metadata ignores unreachable emitted declarations", (t) => {
  const fixture = "test/fixtures/modules/reachable-runtime-main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-runtime-metadata");
  const runtime = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));
  const reachability = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_reachability.json"), "utf8"));
  const helperModule = modulePlan(plan, "test/fixtures/modules/reachable-runtime-lib.js");

  assert.deepEqual(runtime.fragments, ["async-core", "class"]);
  assert.deepEqual(reachability.retainedRuntimeFragments, ["async-core", "class"]);
  assert.equal(runtime.fragments.includes("generator"), false);
  assert.deepEqual(helperModule.reachability.retainedExports, ["used"]);
  assert.deepEqual(helperModule.reachability.prunedExports, ["unusedGenerator"]);
});

test("jayess fs named text imports prune unrelated fs exports and runtime fragments", (t) => {
  const fixture = "test/fixtures/modules/fs-text-only-main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-fs-text-metadata");
  const reachability = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_reachability.json"), "utf8"));
  const fsModule = plan.modules.find((module) => module.sourceFilename?.endsWith(path.join("stdlib", "jayess", "fs", "index.js")));
  const fsReachability = reachability.modules.find((module) => module.standardLibrarySpecifier === "jayess:fs");
  assert.ok(fsModule);
  assert.ok(fsReachability);
  assert.deepEqual(fsReachability.retainedExports, ["readTextSync", "writeTextSync"]);
  assert.ok(fsReachability.prunedExports.includes("tempFileSync"));
  assert.ok(fsReachability.prunedExports.includes("createReadStream"));

  const fsSource = fs.readFileSync(path.join(targetDir, fsModule.generatedSourcePath), "utf8");
  assert.match(fsSource, /readTextSync/);
  assert.match(fsSource, /writeTextSync/);
  assert.doesNotMatch(fsSource, /tempFileSync/);
  assert.doesNotMatch(fsSource, /createReadStream/);
  assert.doesNotMatch(fsSource, /parseJson/);
  assert.doesNotMatch(fsSource, /uuidV4/);

  const runtime = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));
  assert.ok(runtime.fragments.includes("fs"));
  assert.equal(runtime.fragments.includes("stream"), false);
  assert.equal(runtime.fragments.includes("json"), false);
  assert.equal(runtime.fragments.includes("os"), false);
  assert.equal(runtime.fragments.includes("path"), false);

  assert.deepEqual(
    reachability.retainedNativeArtifacts.map((artifact) => artifact.outputPath).sort(),
    ["native/fs-primitives.hpp"]
  );
});

test("jayess console named write import prunes unrelated console exports", (t) => {
  const fixture = "test/fixtures/modules/console-write-only-main.js";
  const { targetDir, plan } = dependencyPlanFor(t, fixture, "reachable-symbol-console-write-metadata");
  const reachability = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_reachability.json"), "utf8"));
  const consoleModule = plan.modules.find((module) => module.sourceFilename?.endsWith(path.join("stdlib", "jayess", "console", "index.js")));
  const consoleReachability = reachability.modules.find((module) => module.standardLibrarySpecifier === "jayess:console");
  assert.ok(consoleModule);
  assert.ok(consoleReachability);
  assert.deepEqual(consoleReachability.retainedExports, ["writeLine"]);
  assert.ok(consoleReachability.prunedExports.includes("prompt"));
  assert.ok(consoleReachability.prunedExports.includes("readLine"));

  const consoleSource = fs.readFileSync(path.join(targetDir, consoleModule.generatedSourcePath), "utf8");
  assert.match(consoleSource, /writeLine/);
  assert.doesNotMatch(consoleSource, /prompt/);
  assert.doesNotMatch(consoleSource, /readLine/);

  const runtime = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));
  assert.ok(runtime.fragments.includes("console"));
  assert.equal(runtime.fragments.includes("fs"), false);
});
