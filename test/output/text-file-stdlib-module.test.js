import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, name) {
  return path.join(
    targetDir,
    "generated-stdlib",
    "jayess",
    name,
    `stdlib_jayess_${name}_index_js.cpp`
  );
}

test("transpileFile resolves text and file standard-library modules", (t) => {
  const targetDir = createManagedTempDir(t, "text-file-stdlib-output");
  const fixture = path.resolve("test/fixtures/modules/text-file-stdlib-main.js");
  const result = transpileFile(fixture, targetDir);
  const dependencyPlan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "csv")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "ini")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "glob")));
  assert.match(dependencyPlan, /"source": "jayess:csv"/);
  assert.match(dependencyPlan, /"source": "jayess:ini"/);
  assert.match(dependencyPlan, /"source": "jayess:glob"/);
});
