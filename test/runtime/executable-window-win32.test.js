import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function windowWin32Main({ header, namespace }) {
  return `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <variant>
#include <vector>
#include "${header}"

#if defined(_WIN32)
extern "C" __declspec(dllimport) void* __stdcall LoadLibraryA(const char*);
extern "C" __declspec(dllimport) void* __stdcall GetProcAddress(void*, const char*);

using jayess_hwnd = void*;
using jayess_uint = unsigned int;
using jayess_wparam = std::uintptr_t;
using jayess_lparam = std::intptr_t;
using jayess_post_message_a_fn = int (*)(jayess_hwnd, jayess_uint, jayess_wparam, jayess_lparam);

constexpr jayess_uint jayess_wm_size = 0x0005U;
constexpr jayess_uint jayess_wm_keydown = 0x0100U;
constexpr jayess_uint jayess_wm_keyup = 0x0101U;
constexpr jayess_uint jayess_wm_mousemove = 0x0200U;
constexpr jayess_uint jayess_wm_lbuttondown = 0x0201U;
constexpr jayess_uint jayess_wm_lbuttonup = 0x0202U;
constexpr jayess_uint jayess_wm_close = 0x0010U;

jayess_lparam jayess_make_lparam(int low, int high) {
  return static_cast<jayess_lparam>((static_cast<unsigned int>(high & 0xffff) << 16U) | static_cast<unsigned int>(low & 0xffff));
}
#endif

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

bool has_event_type(const std::vector<jayess::value>& events, const std::string& type) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == type) {
      return true;
    }
  }
  return false;
}

bool has_resize_event(const std::vector<jayess::value>& events, double width, double height) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == "resize"
        && std::get<double>(event->fields.at("width")) == width
        && std::get<double>(event->fields.at("height")) == height) {
      return true;
    }
  }
  return false;
}

bool has_key_event(const std::vector<jayess::value>& events, const std::string& type, const std::string& key, const std::string& code) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == type
        && std::get<std::string>(event->fields.at("key")) == key
        && std::get<std::string>(event->fields.at("code")) == code) {
      return true;
    }
  }
  return false;
}

bool has_mouse_move_event(const std::vector<jayess::value>& events, double x, double y) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == "mouseMove"
        && std::get<double>(event->fields.at("x")) == x
        && std::get<double>(event->fields.at("y")) == y) {
      return true;
    }
  }
  return false;
}

bool has_mouse_button_event(const std::vector<jayess::value>& events, const std::string& type, const std::string& button, bool pressed) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == type
        && std::get<std::string>(event->fields.at("button")) == button
        && std::get<bool>(event->fields.at("pressed")) == pressed) {
      return true;
    }
  }
  return false;
}

int main() {
  ${namespace}::jayess_module_init();

  auto unavailable = thrown_message(${namespace}::createWindow);
  if (unavailable.find("Jayess window host adapter is not available") != std::string::npos) {
    std::cout << "skip:win32-unavailable\\n";
    return 0;
  }

#if !defined(_WIN32)
  std::cout << "skip:win32-unavailable\\n";
  return 0;
#else
  try {
    auto windowValue = ${namespace}::createWindow(std::vector<jayess::value>{});
    auto window = std::get<jayess::window_ptr>(windowValue);
    require(window->adapter == "windows-win32", "window uses windows-win32 adapter");

    auto shown = ${namespace}::showWindow(std::vector<jayess::value>{windowValue});
    const auto& shownItems = std::get<jayess::array_ptr>(shown)->items;
    require(std::get<double>(shownItems[0]) > 0.0, "window width after show");
    require(std::get<double>(shownItems[1]) > 0.0, "window height after show");
    require(std::get<bool>(shownItems[2]) == false, "window initially open");
    ${namespace}::pollWindow(std::vector<jayess::value>{windowValue});

    auto presented = ${namespace}::presentWindow(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(presented) == true, "window present call");
    require(window->presented_width == 8, "window recorded presented width");
    require(window->presented_height == 6, "window recorded presented height");
    auto renamed = ${namespace}::renameWindow(std::vector<jayess::value>{windowValue, std::string("Updated Win32")});
    require(std::get<bool>(renamed) == true, "window setTitle call");

    auto user32 = LoadLibraryA("user32.dll");
    auto post_message = reinterpret_cast<jayess_post_message_a_fn>(GetProcAddress(user32, "PostMessageA"));
    if (user32 == nullptr || post_message == nullptr) {
      std::cout << "skip:win32-unavailable\\n";
      return 0;
    }

    auto hwnd = window->host_display;
    post_message(hwnd, jayess_wm_size, 0, jayess_make_lparam(120, 70));
    post_message(hwnd, jayess_wm_keydown, static_cast<jayess_wparam>(0x41U), 0);
    post_message(hwnd, jayess_wm_keyup, static_cast<jayess_wparam>(0x1bU), 0);
    post_message(hwnd, jayess_wm_mousemove, 0, jayess_make_lparam(11, 13));
    post_message(hwnd, jayess_wm_lbuttondown, 0, jayess_make_lparam(11, 13));
    post_message(hwnd, jayess_wm_lbuttonup, 0, jayess_make_lparam(11, 13));
    post_message(hwnd, jayess_wm_close, 0, 0);

    std::vector<jayess::value> collected;
    for (int attempt = 0; attempt < 20; attempt = attempt + 1) {
      auto drained = ${namespace}::pollWindow(std::vector<jayess::value>{windowValue});
      const auto& items = std::get<jayess::array_ptr>(drained)->items;
      collected.insert(collected.end(), items.begin(), items.end());
      if (has_resize_event(collected, 120.0, 70.0)
          && has_key_event(collected, "keyDown", "a", "KeyA")
          && has_key_event(collected, "keyUp", "Escape", "Escape")
          && has_mouse_move_event(collected, 11.0, 13.0)
          && has_mouse_button_event(collected, "mouseDown", "left", true)
          && has_mouse_button_event(collected, "mouseUp", "left", false)
          && has_event_type(collected, "close")) {
        break;
      }
      std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    require(has_resize_event(collected, 120.0, 70.0), "win32 resize event normalized");
    require(has_key_event(collected, "keyDown", "a", "KeyA"), "win32 keyDown event normalized");
    require(has_key_event(collected, "keyUp", "Escape", "Escape"), "win32 keyUp event normalized");
    require(has_mouse_move_event(collected, 11.0, 13.0), "win32 mouseMove event normalized");
    require(has_mouse_button_event(collected, "mouseDown", "left", true), "win32 mouseDown event normalized");
    require(has_mouse_button_event(collected, "mouseUp", "left", false), "win32 mouseUp event normalized");
    require(has_event_type(collected, "close"), "win32 close event normalized");

    auto shouldClose = ${namespace}::isClosing(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(shouldClose) == true, "win32 close intent observed");

    auto closeResult = ${namespace}::closeWindow(std::vector<jayess::value>{windowValue});
    require(std::holds_alternative<std::monostate>(closeResult), "win32 close returns null");
    require(window->closed == true, "win32 close marks closed");
    std::cout << "ok\\n";
    return 0;
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      std::cerr << std::get<std::string>(payload) << "\\n";
    }
    return 2;
  } catch (const std::exception& error) {
    std::cerr << error.what() << "\\n";
    return 3;
  }
#endif
}
`;
}

runtimeTest("generated C++ verifies current Win32 window lifecycle, present, resize, close, keyboard, and mouse normalization when the host adapter is available", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/window-win32-main.js");
  const targetDir = createManagedTempDir(t, "runtime-window-win32");
  const result = transpileFile(fixturePath, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));
  const output = compileAndRunCppExecutable(
    cppFiles,
    targetDir,
    windowWin32Main(generatedEntryForFixture(fixturePath))
  );

  if (output.trim() === "skip:win32-unavailable") {
    t.skip("Win32 window adapter is unavailable on this host");
    return;
  }

  assert.equal(output.trim(), "ok");
});
