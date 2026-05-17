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
