import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("window runtime emits Cocoa and Wayland normalized input event bridges", (t) => {
  const targetDir = createManagedTempDir(t, "window-event-parity-output");
  const fixture = path.resolve("test/fixtures/modules/window-main.js");
  transpileFile(fixture, targetDir);

  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(cppSource, /window_macos_key_name/);
  assert.match(cppSource, /jayess_ns_event_key_down/);
  assert.match(cppSource, /jayess_ns_event_left_mouse_down/);
  assert.match(cppSource, /window_push_key_event\(window,/);
  assert.match(cppSource, /window_push_text_input_event\(window,/);
  assert.match(cppSource, /"textInput"/);
  assert.match(cppSource, /jayess_ns_event_key_down \? "keyDown" : "keyUp"/);
  assert.match(cppSource, /window_push_mouse_move_event\(window,/);
  assert.match(cppSource, /window_push_mouse_button_event\(/);
  assert.match(cppSource, /window_push_wheel_event\(/);
  assert.match(cppSource, /\? "mouseDown" : "mouseUp"/);

  assert.match(cppSource, /struct wl_seat_listener/);
  assert.match(cppSource, /struct wl_pointer_listener/);
  assert.match(cppSource, /struct wl_keyboard_listener/);
  assert.match(cppSource, /window_wayland_seat_capabilities/);
  assert.match(cppSource, /window_wayland_add_registry_listener/);
  assert.match(cppSource, /window_wayland_require_registry_globals/);
  assert.match(cppSource, /window_wayland_require_input_capabilities/);
  assert.match(cppSource, /window_wayland_add_shell_listeners/);
  assert.match(cppSource, /window_wayland_allocate_buffer/);
  assert.match(cppSource, /window_wayland_pointer_motion/);
  assert.match(cppSource, /window_wayland_pointer_button/);
  assert.match(cppSource, /window_wayland_pointer_axis/);
  assert.match(cppSource, /window_push_wheel_event\(host->window/);
  assert.match(cppSource, /window_wayland_keyboard_key/);
  assert.match(cppSource, /window_wayland_key_name/);
  assert.match(cppSource, /wl_compositor global was not advertised/);
  assert.match(cppSource, /wl_shm global was not advertised/);
  assert.match(cppSource, /xdg_wm_base global was not advertised/);
  assert.match(cppSource, /wl_seat global was not advertised for input event support/);
  assert.match(cppSource, /wl_seat did not advertise pointer or keyboard input capabilities/);
  assert.match(cppSource, /shared-memory upload file creation failed/);
  assert.match(cppSource, /wl_buffer creation failed/);
});
