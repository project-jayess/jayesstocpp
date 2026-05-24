import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const stem = `stdlib_jayess_${subpath}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", subpath, `${stem}.cpp`);
}

test("transpileFile emits markup and data standard-library modules", (t) => {
  const targetDir = createManagedTempDir(t, "markup-data-output");
  const fixture = path.resolve("test/fixtures/modules/markup-data-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  for (const subpath of ["xml", "yaml", "markdown"]) {
    const modulePath = generatedStdlibCppPath(targetDir, subpath);
    assert.ok(result.files.includes(modulePath), `missing generated ${subpath} module`);
    assert.ok(fs.existsSync(modulePath), `missing ${modulePath}`);
    assert.match(plan, new RegExp(`"source": "jayess:${subpath}"`));
  }
});
