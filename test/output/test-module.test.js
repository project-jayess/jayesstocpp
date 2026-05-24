import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits test standard-library module", (t) => {
  const targetDir = createManagedTempDir(t, "test-stdlib-output");
  const fixture = path.resolve("test/fixtures/modules/test-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const modulePath = path.join(
    targetDir,
    "generated-stdlib",
    "jayess",
    "test",
    "stdlib_jayess_test_index_js.cpp"
  );

  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  assert.match(plan, /"source": "jayess:test"/);
  assert.match(plan, /"source": "jayess:assert"/);
  assert.match(plan, /"source": "jayess:async"/);
});
