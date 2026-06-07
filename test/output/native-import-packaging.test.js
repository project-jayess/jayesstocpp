import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile packages mixed native header, source, and library imports into the target layout", (t) => {
  const targetDir = createManagedTempDir(t, "native-packaging-output");
  const fixture = path.resolve("test/fixtures/modules/native-packaging-user.js");
  const result = transpileFile(fixture, targetDir, { runtimeFragments: "all" });

  const headerPath = path.join(targetDir, "native", "math.hpp");
  const sourcePath = path.join(targetDir, "native", "math.cpp");
  const dllPath = path.join(targetDir, "libraries", "math.dll");
  const libPath = path.join(targetDir, "libraries", "math.lib");
  const modulePath = path.join(targetDir, "native_packaging_user_js.cpp");
  const headerModulePath = path.join(targetDir, "native_packaging_user_js.hpp");
  const planPath = path.join(targetDir, "jayess_dependency_plan.json");
  const hintsPath = path.join(targetDir, "jayess_build_hints.json");
  const reachabilityPath = path.join(targetDir, "jayess_reachability.json");

  assert.ok(result.files.includes(modulePath));
  assert.ok(result.files.includes(headerModulePath));
  assert.ok(result.files.includes(planPath));
  assert.ok(result.files.includes(hintsPath));
  assert.ok(result.files.includes(reachabilityPath));
  assert.ok(fs.existsSync(headerPath));
  assert.ok(fs.existsSync(sourcePath));
  assert.ok(fs.existsSync(dllPath));
  assert.ok(fs.existsSync(libPath));

  const headerSource = fs.readFileSync(headerModulePath, "utf8");
  assert.match(headerSource, /#include "native\/math\.hpp"/);

  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(fixture));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies
      .filter((dependency) => ["native-header", "native-source", "shared-library", "static-library"].includes(dependency.kind))
      .map((dependency) => ({
        source: dependency.source,
        kind: dependency.kind,
        resolved: dependency.resolvedFilename
      })),
    [
      {
        source: "./native/math.hpp",
        kind: "native-header",
        resolved: null
      },
      {
        source: "./native/math.cpp",
        kind: "native-source",
        resolved: null
      },
      {
        source: "./native/math.dll",
        kind: "shared-library",
        resolved: null
      },
      {
        source: "./native/math.lib",
        kind: "static-library",
        resolved: null
      }
    ]
  );

  const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
  assert.ok(hints.nativeArtifacts.includes("native/math.hpp"));
  assert.ok(hints.nativeArtifacts.includes("native/math.cpp"));
  assert.ok(hints.libraryArtifacts.includes("libraries/math.dll"));
  assert.ok(hints.libraryArtifacts.includes("libraries/math.lib"));

  const reachability = JSON.parse(fs.readFileSync(reachabilityPath, "utf8"));
  assert.ok(reachability.retainedRuntimeFragments.includes("array"));
  assert.ok(reachability.retainedRuntimeFragments.includes("class"));
  assert.deepEqual(
    reachability.retainedNativeArtifacts.map((artifact) => ({
      source: artifact.source,
      kind: artifact.kind,
      outputPath: artifact.outputPath
    })),
    [
      { source: "./native/math.cpp", kind: "native-source", outputPath: "native/math.cpp" },
      { source: "./native/math.dll", kind: "shared-library", outputPath: "libraries/math.dll" },
      { source: "./native/math.hpp", kind: "native-header", outputPath: "native/math.hpp" },
      { source: "./native/math.lib", kind: "static-library", outputPath: "libraries/math.lib" }
    ]
  );
});

test("transpileFile prunes native headers used only by unreachable declarations", (t) => {
  const targetDir = createManagedTempDir(t, "native-header-pruning-output");
  const fixture = path.resolve("test/fixtures/modules/reachable-native-main.js");
  const result = transpileFile(fixture, targetDir);

  const nativeHeaderPath = path.join(targetDir, "native", "math.hpp");
  const libHeaderPath = path.join(targetDir, "reachable_native_lib_js.hpp");
  const reachabilityPath = path.join(targetDir, "jayess_reachability.json");

  assert.equal(fs.existsSync(nativeHeaderPath), false);
  assert.ok(result.files.includes(reachabilityPath));

  const libHeader = fs.readFileSync(libHeaderPath, "utf8");
  assert.doesNotMatch(libHeader, /native\/math\.hpp/);

  const reachability = JSON.parse(fs.readFileSync(reachabilityPath, "utf8"));
  assert.deepEqual(reachability.retainedNativeArtifacts, []);
  const libModule = reachability.modules.find((module) => module.sourceFilename === path.resolve("test/fixtures/modules/reachable-native-lib.js"));
  assert.ok(libModule);
  assert.deepEqual(libModule.retainedExports, ["used"]);
  assert.deepEqual(libModule.prunedExports, ["unused"]);
  assert.deepEqual(libModule.retainedImportLocals, []);
});
