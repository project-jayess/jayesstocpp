import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const workflowFixtures = [
  "workflow-cli-config-main.js",
  "workflow-http-main.js",
  "workflow-subprocess-pipeline-main.js",
  "workflow-fs-glob-hash-main.js",
  "workflow-async-cancellation-main.js"
];

test("workflow runtime fixtures transpile into managed projects", (t) => {
  for (const fixture of workflowFixtures) {
    const targetDir = createManagedTempDir(t, `workflow-fixture-${fixture.replaceAll(".", "-")}`);
    const result = transpileFile(path.join("test/fixtures/runtime", fixture), targetDir);
    assert.ok(result.files.some((file) => file.endsWith(".cpp")), `${fixture} emits C++`);
    assert.ok(result.files.every((file) => file.startsWith(targetDir)), `${fixture} stays in managed target`);
  }
});
