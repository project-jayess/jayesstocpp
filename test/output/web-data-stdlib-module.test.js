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

test("transpileFile emits web and data standard-library modules", (t) => {
  const targetDir = createManagedTempDir(t, "web-data-stdlib-output");
  const fixture = path.resolve("test/fixtures/modules/web-data-stdlib-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  for (const subpath of ["querystring", "mime", "form", "toml", "log"]) {
    const modulePath = generatedStdlibCppPath(targetDir, subpath);
    assert.ok(result.files.includes(modulePath), `missing generated ${subpath} module`);
    assert.ok(fs.existsSync(modulePath), `missing ${modulePath}`);
    assert.match(plan, new RegExp(`"source": "jayess:${subpath}"`));
  }
});
