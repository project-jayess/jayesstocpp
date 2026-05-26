export function getWindowWaylandInputCppFragment() {
  return `int window_wayland_fixed_to_int(wl_fixed_t value) {
  return static_cast<int>(std::lround(static_cast<double>(value) / 256.0));
}

int window_wayland_button(std::uint32_t button) {
  if (button == 0x110U) {
    return 0;
  }
  if (button == 0x112U) {
    return 1;
  }
  if (button == 0x111U) {
    return 2;
  }
  return -1;
}

std::string window_wayland_key_name(std::uint32_t key) {
  switch (key) {
    case 1: return "Escape";
    case 14: return "Backspace";
    case 15: return "Tab";
    case 28: return "Enter";
    case 42: return "Shift";
    case 54: return "Shift";
    case 29: return "Control";
    case 97: return "Control";
    case 56: return "Alt";
    case 100: return "Alt";
    case 57: return " ";
    case 103: return "ArrowUp";
    case 105: return "ArrowLeft";
    case 106: return "ArrowRight";
    case 108: return "ArrowDown";
    default:
      break;
  }
  if (key >= 2 && key <= 10) {
    return std::string(1, static_cast<char>('1' + (key - 2)));
  }
  if (key == 11) {
    return "0";
  }
  const char* top = "qwertyuiop";
  if (key >= 16 && key <= 25) {
    return std::string(1, top[key - 16]);
  }
  const char* home = "asdfghjkl";
  if (key >= 30 && key <= 38) {
    return std::string(1, home[key - 30]);
  }
  const char* bottom = "zxcvbnm";
  if (key >= 44 && key <= 50) {
    return std::string(1, bottom[key - 44]);
  }
  return "unknown";
}

void window_wayland_pointer_enter(void* data, wl_pointer*, std::uint32_t, wl_surface*, wl_fixed_t surfaceX, wl_fixed_t surfaceY) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  host->pointer_x = window_wayland_fixed_to_int(surfaceX);
  host->pointer_y = window_wayland_fixed_to_int(surfaceY);
  window_push_mouse_move_event(host->window, host->pointer_x, host->pointer_y);
}

void window_wayland_pointer_leave(void*, wl_pointer*, std::uint32_t, wl_surface*) {}

void window_wayland_pointer_motion(void* data, wl_pointer*, std::uint32_t, wl_fixed_t surfaceX, wl_fixed_t surfaceY) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  host->pointer_x = window_wayland_fixed_to_int(surfaceX);
  host->pointer_y = window_wayland_fixed_to_int(surfaceY);
  window_push_mouse_move_event(host->window, host->pointer_x, host->pointer_y);
}

void window_wayland_pointer_button(void* data, wl_pointer*, std::uint32_t, std::uint32_t, std::uint32_t button, std::uint32_t state) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  const int normalizedButton = window_wayland_button(button);
  if (normalizedButton < 0) {
    return;
  }
  window_push_mouse_button_event(host->window, state == 1U ? "mouseDown" : "mouseUp", normalizedButton, host->pointer_x, host->pointer_y);
}

void window_wayland_pointer_axis(void*, wl_pointer*, std::uint32_t, std::uint32_t, wl_fixed_t) {}

void window_wayland_keyboard_keymap(void*, wl_keyboard*, std::uint32_t, int fd, std::uint32_t) {
  if (fd >= 0) {
    close(fd);
  }
}

void window_wayland_keyboard_enter(void*, wl_keyboard*, std::uint32_t, wl_surface*, wl_array*) {}
void window_wayland_keyboard_leave(void*, wl_keyboard*, std::uint32_t, wl_surface*) {}

void window_wayland_keyboard_key(void* data, wl_keyboard*, std::uint32_t, std::uint32_t, std::uint32_t key, std::uint32_t state) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  window_push_key_event(host->window, state == 1U ? "keyDown" : "keyUp", window_wayland_key_name(key));
}

void window_wayland_keyboard_modifiers(void*, wl_keyboard*, std::uint32_t, std::uint32_t, std::uint32_t, std::uint32_t, std::uint32_t) {}

void window_wayland_seat_name(void*, wl_seat*, const char*) {}

void window_wayland_seat_capabilities(void* data, wl_seat* seat, std::uint32_t capabilities) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  auto& api = window_wayland_api();
  static const wl_pointer_listener pointerListener = {
    window_wayland_pointer_enter,
    window_wayland_pointer_leave,
    window_wayland_pointer_motion,
    window_wayland_pointer_button,
    window_wayland_pointer_axis
  };
  static const wl_keyboard_listener keyboardListener = {
    window_wayland_keyboard_keymap,
    window_wayland_keyboard_enter,
    window_wayland_keyboard_leave,
    window_wayland_keyboard_key,
    window_wayland_keyboard_modifiers
  };
  if ((capabilities & 1U) != 0U && host->pointer == nullptr) {
    host->pointer = reinterpret_cast<wl_pointer*>(api.proxy_marshal_flags(
      reinterpret_cast<wl_proxy*>(seat),
      0,
      &wayland_wl_pointer_interface,
      1,
      0,
      nullptr
    ));
    if (host->pointer != nullptr) {
      api.proxy_add_listener(
        reinterpret_cast<wl_proxy*>(host->pointer),
        reinterpret_cast<void (**)(void)>(const_cast<wl_pointer_listener*>(&pointerListener)),
        host
      );
    }
  }
  if ((capabilities & 2U) != 0U && host->keyboard == nullptr) {
    host->keyboard = reinterpret_cast<wl_keyboard*>(api.proxy_marshal_flags(
      reinterpret_cast<wl_proxy*>(seat),
      1,
      &wayland_wl_keyboard_interface,
      1,
      0,
      nullptr
    ));
    if (host->keyboard != nullptr) {
      api.proxy_add_listener(
        reinterpret_cast<wl_proxy*>(host->keyboard),
        reinterpret_cast<void (**)(void)>(const_cast<wl_keyboard_listener*>(&keyboardListener)),
        host
      );
    }
  }
}

void window_wayland_toplevel_configure(void* data, xdg_toplevel*, std::int32_t width, std::int32_t height, wl_array*) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  if (width > 0 && height > 0) {
    window_push_resize_event(host->window, width, height);
  }
}

void window_wayland_toplevel_close(void* data, xdg_toplevel*) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  if (!host->window->close_requested) {
    window_push_close_event(host->window);
  }
}`;
}
