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
  const windowSource = fs.readFileSync(windowPath, "utf8");
  const plan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const buildHints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));

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
  assert.match(cppSource, /windows-win32/);
  assert.match(cppSource, /user32\.dll/);
  assert.match(cppSource, /gdi32\.dll/);
  assert.match(cppSource, /RegisterClassExA/);
  assert.match(cppSource, /CreateWindowExA/);
  assert.match(cppSource, /StretchDIBits/);
  assert.match(cppSource, /PeekMessageA/);
  assert.match(cppSource, /macos-cocoa/);
  assert.match(cppSource, /NSApplication/);
  assert.match(cppSource, /NSWindow/);
  assert.match(cppSource, /NSImageView/);
  assert.match(cppSource, /NSBitmapImageRep/);
  assert.match(cppSource, /NSImage/);
  assert.match(cppSource, /objc_msgSend/);
  assert.match(cppSource, /linux-x11/);
  assert.match(cppSource, /linux-wayland/);
  assert.match(cppSource, /WAYLAND_DISPLAY/);
  assert.match(cppSource, /libwayland-client\.so\.0/);
  assert.match(cppSource, /xdg_wm_base/);
  assert.match(cppSource, /wl_display_connect/);
  assert.match(cppSource, /wl_display_roundtrip/);
  assert.match(cppSource, /wl_proxy_marshal_flags/);
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
  assert.match(cppSource, /window_push_text_input_event/);
  assert.match(cppSource, /window_push_mouse_move_event/);
  assert.match(cppSource, /window_push_mouse_button_event/);
  assert.match(cppSource, /window_mark_shown/);
  assert.match(cppSource, /window_mark_closed/);
  assert.match(cppSource, /window_record_presented_size/);
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
  assert.match(cppSource, /throw_window_adapter_unavailable/);
  assert.match(cppSource, /Windows Win32 adapter is not available on this host/);
  assert.match(cppSource, /macOS Cocoa adapter is not available on this host/);
  assert.match(cppSource, /throw_window_adapter_unavailable\("X11"/);
  assert.match(cppSource, /throw_window_adapter_unavailable\("Wayland"/);
  assert.match(cppSource, /window_wayland_add_registry_listener/);
  assert.match(cppSource, /window_wayland_require_registry_globals/);
  assert.match(cppSource, /window_wayland_require_input_capabilities/);
  assert.match(cppSource, /window_wayland_add_shell_listeners/);
  assert.match(cppSource, /wl_compositor global was not advertised/);
  assert.match(cppSource, /wl_shm global was not advertised/);
  assert.match(cppSource, /xdg_wm_base global was not advertised/);
  assert.match(cppSource, /Linux window support requires a usable X11 or Wayland adapter on this host/);
  assert.match(cppSource, /"pressed"/);
  assert.match(cppSource, /"textInput"/);
  assert.match(cppSource, /"text"/);
  assert.match(windowSource, /requestFrame/);
  assert.match(windowSource, /runFrame/);
  assert.match(windowSource, /cancelFrame/);
  assert.match(windowSource, /jayess_module_stdlib_jayess_timers_index_js::setTimeout/);
  assert.match(windowSource, /jayess_module_stdlib_jayess_timers_index_js::clearTimeout/);
  assert.match(plan, /"source": "jayess:window"/);
  assert.deepEqual(
    buildHints.platformAdapters.filter((adapter) => adapter.feature === "window").map((adapter) => adapter.adapters),
    [["win32", "cocoa", "x11", "wayland"]]
  );
  assert.deepEqual(buildHints.runtimeRequirements.window.eventFamilies, ["close", "resize", "key", "text-input", "pointer", "mouse-button"]);
  assert.deepEqual(
    buildHints.platformAdapters.filter((adapter) => adapter.feature === "window").map((adapter) => adapter.eventFamilies),
    [["close", "resize", "key", "text-input", "pointer", "mouse-button"]]
  );
});

test("transpileFile emits window plus GUI frame-loop helper output", (t) => {
  const targetDir = createManagedTempDir(t, "window-gui-frame-output");
  const fixture = path.resolve("test/fixtures/modules/window-frame-main.js");
  const result = transpileFile(fixture, targetDir);

  const windowPath = generatedStdlibCppPath(targetDir, "window");
  const guiPath = generatedStdlibCppPath(targetDir, "gui");
  const guiFramePath = path.join(targetDir, "generated-stdlib", "jayess", "gui", "stdlib_jayess_gui_window_frame_js.cpp");
  const windowSource = fs.readFileSync(windowPath, "utf8");
  const guiSource = fs.readFileSync(guiPath, "utf8");
  const guiFrameSource = fs.readFileSync(guiFramePath, "utf8");

  assert.ok(result.files.includes(windowPath));
  assert.ok(result.files.includes(guiPath));
  assert.ok(result.files.includes(guiFramePath));
  assert.match(windowSource, /runFrame/);
  assert.match(guiSource, /runGuiFrame/);
  assert.match(guiFrameSource, /pollEvents/);
  assert.match(guiFrameSource, /present/);
  assert.match(guiFrameSource, /queuedActions/);
  assert.match(guiFrameSource, /rendered/);
  assert.match(guiFrameSource, /presented/);
  assert.match(guiFrameSource, /closed/);
});
