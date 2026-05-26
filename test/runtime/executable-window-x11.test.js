import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { generatedEntryForFixture, skipIfRuntimeUnavailableOutput } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function windowX11Main({ header, namespace }) {
  return `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <variant>
#include <vector>
#include "${header}"

#if !defined(_WIN32) && !defined(__APPLE__)
#include <dlfcn.h>

using jayess_xflush_fn = int (*)(void*);
using jayess_xresize_window_fn = int (*)(void*, unsigned long, unsigned int, unsigned int);
using jayess_xsend_event_fn = int (*)(void*, unsigned long, int, long, void*);
using jayess_xkeysym_to_keycode_fn = unsigned char (*)(void*, unsigned long);

struct jayess_xany_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long window;
};

struct jayess_xkey_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long window;
  unsigned long root;
  unsigned long subwindow;
  unsigned long time;
  int x;
  int y;
  int x_root;
  int y_root;
  unsigned int state;
  unsigned int keycode;
  int same_screen;
};

struct jayess_xbutton_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long window;
  unsigned long root;
  unsigned long subwindow;
  unsigned long time;
  int x;
  int y;
  int x_root;
  int y_root;
  unsigned int state;
  unsigned int button;
  int same_screen;
};

struct jayess_xmotion_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long window;
  unsigned long root;
  unsigned long subwindow;
  unsigned long time;
  int x;
  int y;
  int x_root;
  int y_root;
  unsigned int state;
  char is_hint;
  int same_screen;
};

struct jayess_xclient_message_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long window;
  unsigned long message_type;
  int format;
  union {
    char b[20];
    short s[10];
    long l[5];
  } data;
};

union jayess_xevent {
  int type;
  jayess_xany_event any;
  jayess_xkey_event key;
  jayess_xbutton_event button;
  jayess_xmotion_event motion;
  jayess_xclient_message_event client;
  long padding[24];
};
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

bool has_text_input_event(const std::vector<jayess::value>& events, const std::string& text) {
  for (const auto& item : events) {
    const auto event = std::get<jayess::object_ptr>(item);
    if (std::get<std::string>(event->fields.at("type")) == "textInput"
        && std::get<std::string>(event->fields.at("text")) == text) {
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
    std::cout << "skip:x11-unavailable\\n";
    return 0;
  }

#if defined(_WIN32) || defined(__APPLE__)
  std::cout << "skip:x11-unavailable\\n";
  return 0;
#else
  try {
    auto windowValue = ${namespace}::createWindow(std::vector<jayess::value>{});
    auto window = std::get<jayess::window_ptr>(windowValue);
    require(window->adapter == "linux-x11", "window uses linux-x11 adapter");

    auto shown = ${namespace}::showWindow(std::vector<jayess::value>{windowValue});
    const auto& shownItems = std::get<jayess::array_ptr>(shown)->items;
    require(std::get<double>(shownItems[0]) == 96.0, "window width after show");
    require(std::get<double>(shownItems[1]) == 64.0, "window height after show");
    require(std::get<bool>(shownItems[2]) == false, "window initially open");
    ${namespace}::pollWindow(std::vector<jayess::value>{windowValue});

    auto presented = ${namespace}::presentWindow(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(presented) == true, "window present call");
    require(window->presented_width == 8, "window recorded presented width");
    require(window->presented_height == 6, "window recorded presented height");
    auto renamed = ${namespace}::renameWindow(std::vector<jayess::value>{windowValue, std::string("Updated X11")});
    require(std::get<bool>(renamed) == true, "window setTitle call");

    void* library = dlopen("libX11.so.6", RTLD_LAZY | RTLD_LOCAL);
    if (library == nullptr) {
      std::cout << "skip:x11-unavailable\\n";
      return 0;
    }
    auto flush = reinterpret_cast<jayess_xflush_fn>(dlsym(library, "XFlush"));
    auto resize_window = reinterpret_cast<jayess_xresize_window_fn>(dlsym(library, "XResizeWindow"));
    auto send_event = reinterpret_cast<jayess_xsend_event_fn>(dlsym(library, "XSendEvent"));
    auto keysym_to_keycode = reinterpret_cast<jayess_xkeysym_to_keycode_fn>(dlsym(library, "XKeysymToKeycode"));
    if (flush == nullptr || resize_window == nullptr || send_event == nullptr || keysym_to_keycode == nullptr) {
      std::cout << "skip:x11-unavailable\\n";
      return 0;
    }

    constexpr int keyPress = 2;
    constexpr int keyRelease = 3;
    constexpr int buttonPress = 4;
    constexpr int buttonRelease = 5;
    constexpr int motionNotify = 6;
    constexpr int clientMessage = 33;
    constexpr long keyPressMask = 1L << 0;
    constexpr long keyReleaseMask = 1L << 1;
    constexpr long buttonPressMask = 1L << 2;
    constexpr long buttonReleaseMask = 1L << 3;
    constexpr long pointerMotionMask = 1L << 6;

    resize_window(window->host_display, window->host_window, 120U, 70U);

    jayess_xevent keyDown{};
    keyDown.type = keyPress;
    keyDown.key.display = window->host_display;
    keyDown.key.window = window->host_window;
    keyDown.key.same_screen = 1;
    keyDown.key.keycode = keysym_to_keycode(window->host_display, 0x61UL);
    send_event(window->host_display, window->host_window, 0, keyPressMask, &keyDown);

    jayess_xevent keyUp{};
    keyUp.type = keyRelease;
    keyUp.key.display = window->host_display;
    keyUp.key.window = window->host_window;
    keyUp.key.same_screen = 1;
    keyUp.key.keycode = keysym_to_keycode(window->host_display, 0xff1bUL);
    send_event(window->host_display, window->host_window, 0, keyReleaseMask, &keyUp);

    jayess_xevent move{};
    move.type = motionNotify;
    move.motion.display = window->host_display;
    move.motion.window = window->host_window;
    move.motion.same_screen = 1;
    move.motion.x = 11;
    move.motion.y = 13;
    send_event(window->host_display, window->host_window, 0, pointerMotionMask, &move);

    jayess_xevent buttonDown{};
    buttonDown.type = buttonPress;
    buttonDown.button.display = window->host_display;
    buttonDown.button.window = window->host_window;
    buttonDown.button.same_screen = 1;
    buttonDown.button.button = 1;
    buttonDown.button.x = 11;
    buttonDown.button.y = 13;
    send_event(window->host_display, window->host_window, 0, buttonPressMask, &buttonDown);

    jayess_xevent buttonUp{};
    buttonUp.type = buttonRelease;
    buttonUp.button.display = window->host_display;
    buttonUp.button.window = window->host_window;
    buttonUp.button.same_screen = 1;
    buttonUp.button.button = 1;
    buttonUp.button.x = 11;
    buttonUp.button.y = 13;
    send_event(window->host_display, window->host_window, 0, buttonReleaseMask, &buttonUp);

    if (window->host_close_atom != 0) {
      jayess_xevent close{};
      close.type = clientMessage;
      close.client.display = window->host_display;
      close.client.window = window->host_window;
      close.client.format = 32;
      close.client.data.l[0] = static_cast<long>(window->host_close_atom);
      send_event(window->host_display, window->host_window, 0, 0, &close);
    }
    flush(window->host_display);

    std::vector<jayess::value> collected;
    for (int attempt = 0; attempt < 20; attempt = attempt + 1) {
      auto drained = ${namespace}::pollWindow(std::vector<jayess::value>{windowValue});
      const auto& items = std::get<jayess::array_ptr>(drained)->items;
      collected.insert(collected.end(), items.begin(), items.end());
      if (has_resize_event(collected, 120.0, 70.0)
          && has_key_event(collected, "keyDown", "a", "KeyA")
          && has_text_input_event(collected, "a")
          && has_key_event(collected, "keyUp", "Escape", "Escape")
          && has_mouse_move_event(collected, 11.0, 13.0)
          && has_mouse_button_event(collected, "mouseDown", "left", true)
          && has_mouse_button_event(collected, "mouseUp", "left", false)
          && has_event_type(collected, "close")) {
        break;
      }
      std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    require(has_resize_event(collected, 120.0, 70.0), "x11 resize event normalized");
    require(has_key_event(collected, "keyDown", "a", "KeyA"), "x11 keyDown event normalized");
    require(has_text_input_event(collected, "a"), "x11 textInput event normalized");
    require(has_key_event(collected, "keyUp", "Escape", "Escape"), "x11 keyUp event normalized");
    require(has_mouse_move_event(collected, 11.0, 13.0), "x11 mouseMove event normalized");
    require(has_mouse_button_event(collected, "mouseDown", "left", true), "x11 mouseDown event normalized");
    require(has_mouse_button_event(collected, "mouseUp", "left", false), "x11 mouseUp event normalized");
    require(has_event_type(collected, "close"), "x11 close event normalized");
    auto shouldClose = ${namespace}::isClosing(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(shouldClose) == true, "x11 close intent observed");

    auto closeResult = ${namespace}::closeWindow(std::vector<jayess::value>{windowValue});
    require(std::holds_alternative<std::monostate>(closeResult), "x11 close returns null");
    require(window->closed == true, "x11 close marks closed");
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

runtimeTest("generated C++ verifies current X11 window lifecycle, present, resize, close, keyboard, and mouse normalization when the host adapter is available", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/window-x11-main.js");
  const targetDir = createManagedTempDir(t, "runtime-window-x11");
  const result = transpileFile(fixturePath, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));
  const output = compileAndRunCppExecutable(
    cppFiles,
    targetDir,
    windowX11Main(generatedEntryForFixture(fixturePath))
  );

  if (skipIfRuntimeUnavailableOutput(t, output, "skip:x11-unavailable", {
    moduleName: "jayess:window",
    adapter: "x11",
    capability: "display and event probe"
  })) {
    return;
  }

  assert.equal(output.trim(), "ok");
});
