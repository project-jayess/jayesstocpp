import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { ensureInsideTarget, planModulePaths } from "../../src/output/path-plan.js";

test("path planner generates deterministic safe paths", () => {
  const targetDir = path.resolve("temp", "path-plan");
  const planned = planModulePaths("C:/repo/src/math.js", "C:/repo", targetDir);
  assert.match(planned.headerPath, /src_math_js\.hpp$/);
  assert.equal(ensureInsideTarget(targetDir, planned.cppPath), true);
});

test("path planner preserves repository stdlib identity under generated stdlib", () => {
  const targetDir = path.resolve("temp", "path-plan");
  const planned = planModulePaths(path.resolve("stdlib/jayess/string/index.js"), path.resolve("test/fixtures/modules"), targetDir);

  assert.equal(planned.sourceKind, "repository-stdlib");
  assert.equal(planned.headerIncludePath, "generated-stdlib/jayess/string/stdlib_jayess_string_index_js.hpp");
  assert.equal(planned.cppOutputPath, "generated-stdlib/jayess/string/stdlib_jayess_string_index_js.cpp");
  assert.equal(ensureInsideTarget(targetDir, planned.headerPath), true);
  assert.equal(ensureInsideTarget(targetDir, planned.cppPath), true);
});
