import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("named jayess:font imports retain font runtime without unrelated canvas GUI or window fragments", (t) => {
  const targetDir = createManagedTempDir(t, "font-load-only-output");
  const fixture = path.resolve("test/fixtures/modules/font-load-only-main.js");
  const result = transpileFile(fixture, targetDir);

  const fontPath = path.join(targetDir, "generated-stdlib", "jayess", "font", "stdlib_jayess_font_index_js.cpp");
  const canvasPath = path.join(targetDir, "generated-stdlib", "jayess", "canvas", "stdlib_jayess_canvas_index_js.cpp");
  const guiPath = path.join(targetDir, "generated-stdlib", "jayess", "gui", "stdlib_jayess_gui_index_js.cpp");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.ok(result.files.includes(fontPath));
  assert.equal(result.files.includes(canvasPath), false);
  assert.equal(result.files.includes(guiPath), false);
  assert.match(runtimeHeader, /value font_kind\(const value& path\);/);
  assert.match(runtimeHeader, /value font_load\(const value& name, const value& path, const value& options\);/);
  assert.doesNotMatch(runtimeHeader, /struct window_state \{/);
  assert.doesNotMatch(runtimeHeader, /value image_create\(/);
  assert.doesNotMatch(runtimeSource, /value image_create\(/);
});

test("system font import retains font runtime metadata without canvas GUI window or GPU fragments", (t) => {
  const targetDir = createManagedTempDir(t, "font-system-only-output");
  const fixture = path.resolve("test/fixtures/modules/font-system-only-main.js");
  const result = transpileFile(fixture, targetDir);

  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const buildHints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));
  const dependencyPlan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));

  assert.ok(result.files.some((file) => file.endsWith("stdlib_jayess_font_index_js.cpp")));
  assert.match(runtimeHeader, /value font_system_default\(const value& name, const value& options\);/);
  assert.doesNotMatch(runtimeHeader, /struct window_state \{/);
  assert.doesNotMatch(runtimeHeader, /value gpu_/);
  assert.equal(buildHints.systemFontDiscovery.enabledByRuntimeFragment, true);
  assert.equal(buildHints.systemFontDiscovery.fallbackFont, "jayess-default-5x7");
  assert.equal(dependencyPlan.systemFontDiscovery.runtimeFragment, "font");
});
