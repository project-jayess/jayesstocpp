import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function relativeTree(rootDir) {
  const files = [];

  function visit(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      files.push(path.relative(rootDir, fullPath).replace(/\\/g, "/"));
    }
  }

  visit(rootDir);
  return files.sort();
}

test("transpileFile keeps package and scoped-package module outputs in stable root-level filenames", (t) => {
  const targetDir = createManagedTempDir(t, "target-layout-package-output");
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");

  transpileFile(fixture, targetDir);

  const files = relativeTree(targetDir);
  assert.ok(files.includes("main_js.cpp"));
  assert.ok(files.includes("main_js.hpp"));
  assert.ok(files.includes("_node_modules_jayess_lib_index_js.cpp"));
  assert.ok(files.includes("_node_modules_jayess_lib_index_js.hpp"));
  assert.ok(files.includes("_node_modules__scope_math_src_index_js.cpp"));
  assert.ok(files.includes("_node_modules__scope_math_src_index_js.hpp"));
  assert.ok(files.includes("jayess_dependency_plan.json"));
  assert.ok(files.includes("jayess_module_manifest.json"));
  assert.ok(files.includes("jayess_dependency_graph.json"));
  assert.ok(files.includes("jayess_build_hints.json"));
  assert.ok(files.every((file) => !file.startsWith("node_modules/")));
});

test("transpileFile keeps copied native artifacts in stable native and library buckets", (t) => {
  const targetDir = createManagedTempDir(t, "target-layout-native-output");
  const fixture = path.resolve("test/fixtures/modules/native-packaging-user.js");

  transpileFile(fixture, targetDir, { runtimeFragments: "all" });

  const files = relativeTree(targetDir);
  assert.ok(files.includes("native_packaging_user_js.cpp"));
  assert.ok(files.includes("native_packaging_user_js.hpp"));
  assert.ok(files.includes("native/math.hpp"));
  assert.ok(files.includes("native/math.cpp"));
  assert.ok(files.includes("libraries/math.dll"));
  assert.ok(files.includes("libraries/math.lib"));
  assert.ok(files.includes("jayess_dependency_plan.json"));
  assert.ok(files.includes("jayess_build_hints.json"));
});
