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

test("transpileFile resolves high-level Jayess standard-library modules", (t) => {
  const targetDir = createManagedTempDir(t, "high-level-stdlib-output");
  const fixture = path.resolve("test/fixtures/modules/high-level-stdlib-main.js");
  const result = transpileFile(fixture, targetDir);
  const dependencyPlan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  for (const subpath of ["cli", "uuid", "hash", "dotenv"]) {
    const modulePath = generatedStdlibCppPath(targetDir, subpath);
    assert.ok(result.files.includes(modulePath), `missing ${subpath} generated module`);
  }

  assert.match(dependencyPlan, /"source": "jayess:cli"/);
  assert.match(dependencyPlan, /"source": "jayess:uuid"/);
  assert.match(dependencyPlan, /"source": "jayess:hash"/);
  assert.match(dependencyPlan, /"source": "jayess:dotenv"/);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "crypto-primitives.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "encoding-primitives.hpp")));
});
