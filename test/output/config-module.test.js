import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits config standard-library module", (t) => {
  const targetDir = createManagedTempDir(t, "config-stdlib-output");
  const fixture = path.resolve("test/fixtures/modules/config-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const modulePath = path.join(
    targetDir,
    "generated-stdlib",
    "jayess",
    "config",
    "stdlib_jayess_config_index_js.cpp"
  );

  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  assert.match(plan, /"source": "jayess:config"/);
  assert.match(plan, /"source": "jayess:json"/);
  assert.match(plan, /"source": "jayess:toml"/);
  assert.match(plan, /"source": "jayess:dotenv"/);
});
