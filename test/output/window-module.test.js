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

test("transpileFile emits window module runtime and native bridge output", (t) => {
  const targetDir = createManagedTempDir(t, "window-output");
  const fixture = path.resolve("test/fixtures/modules/window-main.js");
  const result = transpileFile(fixture, targetDir);

  const windowPath = generatedStdlibCppPath(targetDir, "window");
  const primitivePath = path.join(targetDir, "native", "window-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.ok(result.files.includes(windowPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(headerSource, /struct window_state/);
  assert.match(headerSource, /using window_ptr = std::shared_ptr<window_state>;/);
  assert.match(headerSource, /value window_should_close\(const value& window\);/);
  assert.match(headerSource, /value window_request_close\(const value& window\);/);
  assert.match(cppSource, /window_platform_available/);
  assert.match(cppSource, /window_platform_create/);
  assert.match(cppSource, /window_platform_show/);
  assert.match(cppSource, /window_platform_close/);
  assert.match(cppSource, /window_platform_set_title/);
  assert.match(cppSource, /window_platform_present/);
  assert.match(cppSource, /window_platform_poll_events/);
  assert.match(cppSource, /linux-x11/);
  assert.match(cppSource, /XSelectInput/);
  assert.match(cppSource, /XPending/);
  assert.match(cppSource, /XNextEvent/);
  assert.match(cppSource, /XInternAtom/);
  assert.match(cppSource, /XSetWMProtocols/);
  assert.match(cppSource, /XLookupKeysym/);
  assert.match(cppSource, /window_normalize_key/);
  assert.match(cppSource, /window_normalize_mouse_button/);
  assert.match(cppSource, /window_push_close_event/);
  assert.match(cppSource, /window_push_resize_event/);
  assert.match(cppSource, /window_push_key_event/);
  assert.match(cppSource, /window_push_mouse_move_event/);
  assert.match(cppSource, /window_push_mouse_button_event/);
  assert.match(cppSource, /window_event_code_for_key/);
  assert.match(cppSource, /window_linux_key_name/);
  assert.match(cppSource, /WM_DELETE_WINDOW/);
  assert.match(cppSource, /require_canvas_image_value/);
  assert.match(cppSource, /require_window_canvas_pixels/);
  assert.match(cppSource, /XCreateImage/);
  assert.match(cppSource, /XPutImage/);
  assert.match(cppSource, /XDestroyImage/);
  assert.match(cppSource, /Jayess window present found an invalid canvas image buffer/);
  assert.match(cppSource, /window_should_close/);
  assert.match(cppSource, /window_request_close/);
  assert.match(cppSource, /Jayess window host adapter is not available on this platform/);
  assert.match(cppSource, /"pressed"/);
  assert.match(plan, /"source": "jayess:window"/);
});
