import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("named jayess:font imports retain font runtime without unrelated canvas or window fragments", (t) => {
  const targetDir = createManagedTempDir(t, "font-load-only-output");
  const fixture = path.resolve("test/fixtures/modules/font-load-only-main.js");
  const result = transpileFile(fixture, targetDir);

  const fontPath = path.join(targetDir, "generated-stdlib", "jayess", "font", "stdlib_jayess_font_index_js.cpp");
  const canvasPath = path.join(targetDir, "generated-stdlib", "jayess", "canvas", "stdlib_jayess_canvas_index_js.cpp");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.ok(result.files.includes(fontPath));
  assert.equal(result.files.includes(canvasPath), false);
  assert.match(runtimeHeader, /value font_kind\(const value& path\);/);
  assert.match(runtimeHeader, /value font_load\(const value& name, const value& path, const value& options\);/);
  assert.doesNotMatch(runtimeHeader, /struct window_state \{/);
  assert.doesNotMatch(runtimeHeader, /value image_create\(/);
  assert.doesNotMatch(runtimeSource, /value image_create\(/);
});

test("system font import retains font runtime metadata without canvas window or GPU fragments", (t) => {
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

test("packFont packages font assets and lowers to generated asset path", (t) => {
  const targetDir = createManagedTempDir(t, "font-pack-output");
  const fixture = path.resolve("test/fixtures/modules/font-pack-main.js");
  const result = transpileFile(fixture, targetDir);

  const fontAssetPath = path.join(targetDir, "assets", "fonts", "probe.ttf");
  const entryCpp = fs.readFileSync(path.join(targetDir, "font_pack_main_js.cpp"), "utf8");
  const buildHints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));
  const dependencyPlan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));

  assert.ok(result.files.some((file) => file.endsWith("stdlib_jayess_font_index_js.cpp")));
  assert.ok(fs.existsSync(fontAssetPath));
  assert.match(entryCpp, /packFont/);
  assert.match(entryCpp, /assets\/fonts\/probe\.ttf/);
  assert.deepEqual(buildHints.fontArtifacts, ["assets/fonts/probe.ttf"]);

  const entry = dependencyPlan.modules.find((module) => module.sourceFilename === fixture);
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies
      .filter((dependency) => dependency.kind === "font-asset")
      .map((dependency) => ({
        source: dependency.source,
        outputPath: dependency.outputPath
      })),
    [
      { source: "./fonts/probe.ttf", outputPath: "assets/fonts/probe.ttf" }
    ]
  );
});

test("packFont preserves TrueType-style OTF handles for rasterization", (t) => {
  const targetDir = createManagedTempDir(t, "font-pack-otf-output");
  const fixture = path.resolve("test/fixtures/modules/font-pack-otf-main.js");
  const result = transpileFile(fixture, targetDir);

  const fontAssetPath = path.join(targetDir, "assets", "fonts", "probe.otf");
  const entryCpp = fs.readFileSync(path.join(targetDir, "font_pack_otf_main_js.cpp"), "utf8");
  const fontCpp = fs.readFileSync(path.join(targetDir, "generated-stdlib", "jayess", "font", "stdlib_jayess_font_index_js.cpp"), "utf8");
  const buildHints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));

  assert.ok(result.files.some((file) => file.endsWith("stdlib_jayess_font_index_js.cpp")));
  assert.ok(fs.existsSync(fontAssetPath));
  assert.match(entryCpp, /assets\/fonts\/probe\.otf/);
  assert.match(fontCpp, /truetype/);
  assert.deepEqual(buildHints.fontArtifacts, ["assets/fonts/probe.otf"]);
});
