import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createManagedTempDir } from "../support/temp-dir.js";

test("internal transpile tool writes generated project output", (t) => {
  const targetDir = createManagedTempDir(t, "internal-transpile-tool");
  const stdout = execFileSync(process.execPath, [
    "tools/transpile-file.js",
    "test/fixtures/modules/native-entry-main.js",
    targetDir
  ], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  const result = JSON.parse(stdout);

  assert.equal(result.targetDirname, path.resolve(targetDir));
  assert.ok(result.files.includes("jayess_dependency_plan.json"));
  assert.ok(result.files.includes("executable/jayess_main.cpp"));
  assert.ok(fs.existsSync(path.join(targetDir, "jayess_dependency_plan.json")));
  assert.ok(fs.existsSync(path.join(targetDir, "executable", "jayess_main.cpp")));
});
