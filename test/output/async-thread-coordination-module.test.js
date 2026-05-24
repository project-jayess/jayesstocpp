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

test("transpileFile emits async coordination modules and runtime fragments", (t) => {
  const targetDir = createManagedTempDir(t, "async-thread-coordination-output");
  const fixture = path.resolve("test/fixtures/modules/async-thread-coordination-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");

  for (const subpath of ["async", "channel", "workqueue", "thread"]) {
    const modulePath = generatedStdlibCppPath(targetDir, subpath);
    assert.ok(result.files.includes(modulePath), `missing generated ${subpath} module`);
    assert.ok(fs.existsSync(modulePath), `missing ${modulePath}`);
  }
  assert.match(plan, /"source": "jayess:channel"/);
  assert.match(plan, /"source": "jayess:workqueue"/);
  assert.match(runtimeHeader, /struct cancellation_token_state/);
  assert.match(runtimeHeader, /struct channel_state/);
  const asyncModule = fs.readFileSync(generatedStdlibCppPath(targetDir, "async"), "utf8");
  assert.match(asyncModule, /withTimeout/);
  assert.match(asyncModule, /timeoutWithCancellation/);
});
