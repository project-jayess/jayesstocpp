import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile resolves built-in Jayess process module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-process-output");
  const fixture = path.resolve("test/fixtures/modules/process-main.js");
  const result = transpileFile(fixture, targetDir);

  const modulePath = generatedStdlibCppPath(targetDir, "process");
  assert.ok(result.files.some((file) => file.endsWith("process_main_js.cpp")));
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "process-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "process-primitives.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const dependencyPlan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.match(primitiveSource, /jayessProcessHasEnv/);
  assert.match(primitiveSource, /jayessProcessEnvKeys/);
  assert.match(primitiveSource, /jayessProcessEnvEntries/);
  assert.match(runtimeHeader, /value process_env_keys\(\);/);
  assert.match(runtimeHeader, /value process_env_entries\(\);/);
  assert.match(runtimeSource, /value process_env_keys\(\)/);
  assert.match(runtimeSource, /value process_env_entries\(\)/);
  assert.match(dependencyPlan, /"source": "jayess:process"/);
});
