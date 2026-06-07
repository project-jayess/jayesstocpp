import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits cookie standard-library module", (t) => {
  const targetDir = createManagedTempDir(t, "cookie-output");
  const fixture = path.resolve("test/fixtures/modules/cookie-main.js");
  const result = transpileFile(fixture, targetDir);
  const modulePath = path.join(targetDir, "generated-stdlib", "jayess", "cookie", "stdlib_jayess_cookie_index_js.cpp");
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  assert.match(plan, /"source": "jayess:cookie"/);
  assert.doesNotMatch(plan, /"source": "jayess:http"/);
});
