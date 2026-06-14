import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_").replace(/[^A-Za-z0-9_]/g, "_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile emits jayess:html and dependency metadata", (t) => {
  const targetDir = createManagedTempDir(t, "html-output");
  const fixture = path.resolve("test/fixtures/modules/html-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const modulePath = generatedStdlibCppPath(targetDir, "html");

  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  assert.ok(result.files.includes(path.join(targetDir, "generated-stdlib", "jayess", "html", "stdlib_jayess_html_sanitize_js.cpp")));
  assert.match(plan, /"source": "jayess:html"/);
  assert.match(plan, /"source": "jayess:string"/);
  assert.match(plan, /"source": "jayess:array"/);
  assert.match(plan, /"source": "jayess:object"/);
  assert.doesNotMatch(plan, /"source": "jayess:window"/);
  assert.doesNotMatch(plan, /"source": "jayess:canvas"/);
});

test("transpileFile emits jayess:gui html renderer facade and dependencies", (t) => {
  const targetDir = createManagedTempDir(t, "html-renderer-output");
  const fixture = path.resolve("test/fixtures/modules/html-renderer-main.js");
  const result = transpileFile(fixture, targetDir);
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const rendererPath = generatedStdlibCppPath(targetDir, "gui/html-renderer");
  const rendererSource = fs.readFileSync(rendererPath, "utf8");

  assert.ok(result.files.includes(rendererPath));
  assert.match(rendererSource, /htmlRenderer/);
  assert.match(rendererSource, /reloadHtmlRenderer/);
  assert.match(rendererSource, /pollEvents/);
  assert.match(rendererSource, /present/);
  assert.match(plan, /"source": "jayess:gui\/html-renderer"/);
  assert.match(plan, /"source": "jayess:canvas"/);
  assert.match(plan, /"source": "jayess:window"/);
});
