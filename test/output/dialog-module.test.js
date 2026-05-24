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

test("transpileFile emits dialog module runtime and native bridge output", (t) => {
  const targetDir = createManagedTempDir(t, "dialog-output");
  const fixture = path.resolve("test/fixtures/modules/dialog-main.js");
  const result = transpileFile(fixture, targetDir);

  const dialogPath = generatedStdlibCppPath(targetDir, "dialog");
  const primitivePath = path.join(targetDir, "native", "dialog-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const dialogSource = fs.readFileSync(dialogPath, "utf8");
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const hints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));

  assert.ok(result.files.includes(dialogPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(headerSource, /value dialog_open_file_async\(const value& options\);/);
  assert.match(headerSource, /value dialog_save_file_async\(const value& options\);/);
  assert.match(headerSource, /value dialog_open_directory_async\(const value& options\);/);
  assert.match(headerSource, /value dialog_message_async\(const value& options\);/);
  assert.match(cppSource, /DIALOG_UNAVAILABLE_MESSAGE/);
  assert.match(cppSource, /dialog_async_result/);
  assert.match(cppSource, /dialog_require_options_object/);
  assert.match(cppSource, /dialog_validate_filters_option/);
  assert.match(cppSource, /dialog_validate_buttons_option/);
  assert.match(cppSource, /dialog_windows_platform_available/);
  assert.match(cppSource, /dialog_macos_platform_available/);
  assert.match(cppSource, /NSOpenPanel/);
  assert.match(cppSource, /xdg-desktop-portal/);
  assert.match(cppSource, /GetOpenFileNameA/);
  assert.match(cppSource, /MessageBoxA/);
  assert.match(cppSource, /Jayess dialog host adapter is not available on this platform/);
  assert.match(cppSource, /dialog .* options must be an object/);
  assert.match(dialogSource, /openFile/);
  assert.match(dialogSource, /saveFile/);
  assert.match(dialogSource, /openDirectory/);
  assert.match(dialogSource, /message/);
  assert.match(plan, /"source": "jayess:dialog"/);
  assert.deepEqual(
    hints.platformAdapters.filter((adapter) => adapter.feature === "dialog").map((adapter) => adapter.adapters),
    [["win32-dialog", "cocoa-dialog", "linux-portal-dialog"]]
  );
});
