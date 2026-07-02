import { getWindowWaylandAdapterCppFragment } from "./runtime-window-wayland-source.js";

export function getWindowLinuxAdapterCppFragment() {
  return `#if !defined(_WIN32) && !defined(__APPLE__)
using jayess_xopen_display_fn = void* (*)(const char*);
using jayess_xdefault_screen_fn = int (*)(void*);
using jayess_xdefault_depth_fn = int (*)(void*, int);
using jayess_xdefault_gc_fn = void* (*)(void*, int);
using jayess_xdefault_visual_fn = void* (*)(void*, int);
using jayess_xroot_window_fn = unsigned long (*)(void*, int);
using jayess_xcreate_simple_window_fn = unsigned long (*)(void*, unsigned long, int, int, unsigned int, unsigned int, unsigned int, unsigned long, unsigned long);
using jayess_xcreate_image_fn = void* (*)(void*, void*, unsigned int, int, int, char*, unsigned int, unsigned int, int, int);
using jayess_xput_image_fn = int (*)(void*, unsigned long, void*, void*, int, int, int, int, unsigned int, unsigned int);
using jayess_xdestroy_image_fn = int (*)(void*);
using jayess_xstore_name_fn = int (*)(void*, unsigned long, const char*);
using jayess_xmap_window_fn = int (*)(void*, unsigned long);
using jayess_xunmap_window_fn = int (*)(void*, unsigned long);
using jayess_xdestroy_window_fn = int (*)(void*, unsigned long);
using jayess_xclose_display_fn = int (*)(void*);
using jayess_xflush_fn = int (*)(void*);
using jayess_xselect_input_fn = int (*)(void*, unsigned long, long);
using jayess_xpending_fn = int (*)(void*);
using jayess_xnext_event_fn = int (*)(void*, void*);
using jayess_xintern_atom_fn = unsigned long (*)(void*, const char*, int);
using jayess_xset_wm_protocols_fn = int (*)(void*, unsigned long, unsigned long*, int);
using jayess_xlookup_keysym_fn = unsigned long (*)(void*, int);
using jayess_xchange_property_fn = int (*)(void*, unsigned long, unsigned long, unsigned long, int, int, const unsigned char*, int);

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

struct jayess_xconfigure_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long event;
  unsigned long window;
  int x;
  int y;
  int width;
  int height;
  int border_width;
  unsigned long above;
  int override_redirect;
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
  jayess_xconfigure_event configure;
  jayess_xclient_message_event client;
  long padding[24];
};

struct jayess_linux_window_api {
  void* library = nullptr;
  jayess_xopen_display_fn open_display = nullptr;
  jayess_xdefault_screen_fn default_screen = nullptr;
  jayess_xdefault_depth_fn default_depth = nullptr;
  jayess_xdefault_gc_fn default_gc = nullptr;
  jayess_xdefault_visual_fn default_visual = nullptr;
  jayess_xroot_window_fn root_window = nullptr;
  jayess_xcreate_simple_window_fn create_simple_window = nullptr;
  jayess_xcreate_image_fn create_image = nullptr;
  jayess_xput_image_fn put_image = nullptr;
  jayess_xdestroy_image_fn destroy_image = nullptr;
  jayess_xstore_name_fn store_name = nullptr;
  jayess_xmap_window_fn map_window = nullptr;
  jayess_xunmap_window_fn unmap_window = nullptr;
  jayess_xdestroy_window_fn destroy_window = nullptr;
  jayess_xclose_display_fn close_display = nullptr;
  jayess_xflush_fn flush = nullptr;
  jayess_xselect_input_fn select_input = nullptr;
  jayess_xpending_fn pending = nullptr;
  jayess_xnext_event_fn next_event = nullptr;
  jayess_xintern_atom_fn intern_atom = nullptr;
  jayess_xset_wm_protocols_fn set_wm_protocols = nullptr;
  jayess_xlookup_keysym_fn lookup_keysym = nullptr;
  jayess_xchange_property_fn change_property = nullptr;
  bool attempted = false;
};

struct jayess_motif_wm_hints {
  unsigned long flags;
  unsigned long functions;
  unsigned long decorations;
  long input_mode;
  unsigned long status;
};

jayess_linux_window_api& window_linux_api() {
  static jayess_linux_window_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.library = dlopen("libX11.so.6", RTLD_LAZY | RTLD_LOCAL);
  if (api.library == nullptr) {
    return api;
  }
  api.open_display = reinterpret_cast<jayess_xopen_display_fn>(dlsym(api.library, "XOpenDisplay"));
  api.default_screen = reinterpret_cast<jayess_xdefault_screen_fn>(dlsym(api.library, "XDefaultScreen"));
  api.default_depth = reinterpret_cast<jayess_xdefault_depth_fn>(dlsym(api.library, "XDefaultDepth"));
  api.default_gc = reinterpret_cast<jayess_xdefault_gc_fn>(dlsym(api.library, "XDefaultGC"));
  api.default_visual = reinterpret_cast<jayess_xdefault_visual_fn>(dlsym(api.library, "XDefaultVisual"));
  api.root_window = reinterpret_cast<jayess_xroot_window_fn>(dlsym(api.library, "XRootWindow"));
  api.create_simple_window = reinterpret_cast<jayess_xcreate_simple_window_fn>(dlsym(api.library, "XCreateSimpleWindow"));
  api.create_image = reinterpret_cast<jayess_xcreate_image_fn>(dlsym(api.library, "XCreateImage"));
  api.put_image = reinterpret_cast<jayess_xput_image_fn>(dlsym(api.library, "XPutImage"));
  api.destroy_image = reinterpret_cast<jayess_xdestroy_image_fn>(dlsym(api.library, "XDestroyImage"));
  api.store_name = reinterpret_cast<jayess_xstore_name_fn>(dlsym(api.library, "XStoreName"));
  api.map_window = reinterpret_cast<jayess_xmap_window_fn>(dlsym(api.library, "XMapWindow"));
  api.unmap_window = reinterpret_cast<jayess_xunmap_window_fn>(dlsym(api.library, "XUnmapWindow"));
  api.destroy_window = reinterpret_cast<jayess_xdestroy_window_fn>(dlsym(api.library, "XDestroyWindow"));
  api.close_display = reinterpret_cast<jayess_xclose_display_fn>(dlsym(api.library, "XCloseDisplay"));
  api.flush = reinterpret_cast<jayess_xflush_fn>(dlsym(api.library, "XFlush"));
  api.select_input = reinterpret_cast<jayess_xselect_input_fn>(dlsym(api.library, "XSelectInput"));
  api.pending = reinterpret_cast<jayess_xpending_fn>(dlsym(api.library, "XPending"));
  api.next_event = reinterpret_cast<jayess_xnext_event_fn>(dlsym(api.library, "XNextEvent"));
  api.intern_atom = reinterpret_cast<jayess_xintern_atom_fn>(dlsym(api.library, "XInternAtom"));
  api.set_wm_protocols = reinterpret_cast<jayess_xset_wm_protocols_fn>(dlsym(api.library, "XSetWMProtocols"));
  api.lookup_keysym = reinterpret_cast<jayess_xlookup_keysym_fn>(dlsym(api.library, "XLookupKeysym"));
  api.change_property = reinterpret_cast<jayess_xchange_property_fn>(dlsym(api.library, "XChangeProperty"));
  return api;
}

bool window_x11_platform_available() {
  auto& api = window_linux_api();
  return api.open_display != nullptr
    && api.default_screen != nullptr
    && api.default_depth != nullptr
    && api.default_gc != nullptr
    && api.default_visual != nullptr
    && api.root_window != nullptr
    && api.create_simple_window != nullptr
    && api.create_image != nullptr
    && api.put_image != nullptr
    && api.destroy_image != nullptr
    && api.store_name != nullptr
    && api.map_window != nullptr
    && api.unmap_window != nullptr
    && api.destroy_window != nullptr
    && api.close_display != nullptr
    && api.flush != nullptr
    && api.select_input != nullptr
    && api.pending != nullptr
    && api.next_event != nullptr
    && api.intern_atom != nullptr
    && api.set_wm_protocols != nullptr
    && api.lookup_keysym != nullptr
    && api.change_property != nullptr;
}

std::string window_linux_key_name(unsigned long keysym) {
  if (keysym >= 32UL && keysym <= 126UL) {
    return std::string(1, static_cast<char>(keysym));
  }
  if (keysym == 0xff08UL) {
    return "Backspace";
  }
  if (keysym == 0xff09UL) {
    return "Tab";
  }
  if (keysym == 0xff0dUL) {
    return "Enter";
  }
  if (keysym == 0xff1bUL) {
    return "Escape";
  }
  if (keysym == 0xff51UL) {
    return "ArrowLeft";
  }
  if (keysym == 0xff52UL) {
    return "ArrowUp";
  }
  if (keysym == 0xff53UL) {
    return "ArrowRight";
  }
  if (keysym == 0xff54UL) {
    return "ArrowDown";
  }
  if (keysym == 0xffe1UL || keysym == 0xffe2UL) {
    return "Shift";
  }
  if (keysym == 0xffe3UL || keysym == 0xffe4UL) {
    return "Control";
  }
  if (keysym == 0xffe9UL || keysym == 0xffeaUL) {
    return "Alt";
  }
  if (keysym == 0xffebUL || keysym == 0xffecUL) {
    return "Meta";
  }
  return "unknown";
}

void window_x11_platform_frame(const window_ptr& window) {
  auto& api = window_linux_api();
  if (window->host_display == nullptr || window->host_window == 0) {
    throw_window_adapter_unavailable("X11", "window handle is not open");
  }
  auto motifHintsAtom = api.intern_atom(window->host_display, "_MOTIF_WM_HINTS", 0);
  if (motifHintsAtom == 0) {
    throw_window_adapter_unavailable("X11", "_MOTIF_WM_HINTS atom is unavailable");
  }
  constexpr unsigned long mwmHintsDecorations = 1UL << 1U;
  constexpr int propModeReplace = 0;
  jayess_motif_wm_hints hints{};
  hints.flags = mwmHintsDecorations;
  hints.decorations = window->framed ? 1UL : 0UL;
  api.change_property(
    window->host_display,
    window->host_window,
    motifHintsAtom,
    motifHintsAtom,
    32,
    propModeReplace,
    reinterpret_cast<const unsigned char*>(&hints),
    5
  );
  api.flush(window->host_display);
}

void window_x11_platform_create(const window_ptr& window) {
  auto& api = window_linux_api();
  void* display = api.open_display(nullptr);
  if (display == nullptr) {
    throw_window_adapter_unavailable("X11", "XOpenDisplay failed");
  }
  const auto screen = api.default_screen(display);
  const auto root = api.root_window(display, screen);
  const auto hostWindow = api.create_simple_window(
    display,
    root,
    0,
    0,
    static_cast<unsigned int>(window->width),
    static_cast<unsigned int>(window->height),
    0,
    0,
    0x000000
  );
  if (hostWindow == 0) {
    api.close_display(display);
    throw_window_adapter_unavailable("X11", "XCreateSimpleWindow failed");
  }
  window->adapter = "linux-x11";
  window->host_display = display;
  window->host_window = hostWindow;
  constexpr long eventMask = (1L << 0) | (1L << 1) | (1L << 2) | (1L << 3) | (1L << 6) | (1L << 15) | (1L << 17);
  api.select_input(display, hostWindow, eventMask);
  auto deleteAtom = api.intern_atom(display, "WM_DELETE_WINDOW", 0);
  if (deleteAtom != 0) {
    window->host_close_atom = deleteAtom;
    api.set_wm_protocols(display, hostWindow, &deleteAtom, 1);
  }
  api.store_name(display, hostWindow, window->title.c_str());
  window_x11_platform_frame(window);
  api.flush(display);
}

void window_x11_platform_show(const window_ptr& window) {
  auto& api = window_linux_api();
  api.map_window(window->host_display, window->host_window);
  api.flush(window->host_display);
  window->shown = true;
}

void window_x11_platform_hide(const window_ptr& window) {
  auto& api = window_linux_api();
  api.unmap_window(window->host_display, window->host_window);
  api.flush(window->host_display);
}

void window_x11_platform_close(const window_ptr& window) {
  if (window->host_display == nullptr || window->host_window == 0) {
    return;
  }
  auto& api = window_linux_api();
  api.destroy_window(window->host_display, window->host_window);
  api.close_display(window->host_display);
  window->host_display = nullptr;
  window->host_window = 0;
}

void window_x11_platform_set_title(const window_ptr& window) {
  auto& api = window_linux_api();
  api.store_name(window->host_display, window->host_window, window->title.c_str());
  api.flush(window->host_display);
}

void window_x11_platform_present(const window_ptr& window, const window_canvas_pixels& canvas) {
  auto& api = window_linux_api();
  if (window->host_display == nullptr || window->host_window == 0) {
    throw_window_unavailable();
  }
  if (canvas.pixels == nullptr || canvas.width <= 0 || canvas.height <= 0) {
    throw std::runtime_error("Jayess window present expects a non-empty canvas image buffer");
  }
  const auto expectedSize = static_cast<std::size_t>(canvas.width) * static_cast<std::size_t>(canvas.height) * 4U;
  if (canvas.pixels->size() < expectedSize) {
    throw std::runtime_error("Jayess window present found an invalid canvas image buffer");
  }
  const auto screen = api.default_screen(window->host_display);
  const auto visual = api.default_visual(window->host_display, screen);
  const auto depth = api.default_depth(window->host_display, screen);
  const auto gc = api.default_gc(window->host_display, screen);
  if (visual == nullptr || gc == nullptr || depth <= 0) {
    throw_window_adapter_unavailable("X11", "default visual, depth, or graphics context is unavailable");
  }
  const auto uploadWidth = (std::max)(canvas.width, (std::max)(1, window->width));
  const auto uploadHeight = (std::max)(canvas.height, (std::max)(1, window->height));
  const auto byteCount = static_cast<std::size_t>(uploadWidth) * static_cast<std::size_t>(uploadHeight) * 4U;
  auto* data = static_cast<char*>(std::malloc(byteCount));
  if (data == nullptr) {
    throw std::runtime_error("Jayess window present could not allocate image upload buffer");
  }
  std::memset(data, 0, byteCount);
  for (int row = 0; row < canvas.height; ++row) {
    const auto sourceRow = static_cast<std::size_t>(row) * static_cast<std::size_t>(canvas.width) * 4U;
    const auto targetRow = static_cast<std::size_t>(row) * static_cast<std::size_t>(uploadWidth) * 4U;
    for (int column = 0; column < canvas.width; ++column) {
      const auto source = sourceRow + static_cast<std::size_t>(column) * 4U;
      const auto target = targetRow + static_cast<std::size_t>(column) * 4U;
      data[target] = static_cast<char>((*canvas.pixels)[source + 2U]);
      data[target + 1U] = static_cast<char>((*canvas.pixels)[source + 1U]);
      data[target + 2U] = static_cast<char>((*canvas.pixels)[source]);
      data[target + 3U] = static_cast<char>(0);
    }
  }
  constexpr int zPixmap = 2;
  void* image = api.create_image(
    window->host_display,
    visual,
    static_cast<unsigned int>(depth),
    zPixmap,
    0,
    data,
    static_cast<unsigned int>(uploadWidth),
    static_cast<unsigned int>(uploadHeight),
    32,
    0
  );
  if (image == nullptr) {
    std::free(data);
    throw_window_adapter_unavailable("X11", "XCreateImage failed");
  }
  api.put_image(
    window->host_display,
    window->host_window,
    gc,
    image,
    0,
    0,
    0,
    0,
    static_cast<unsigned int>(uploadWidth),
    static_cast<unsigned int>(uploadHeight)
  );
  api.destroy_image(image);
  window->presented_width = canvas.width;
  window->presented_height = canvas.height;
  api.flush(window->host_display);
}

void window_x11_platform_poll_events(const window_ptr& window) {
  if (window->host_display == nullptr || window->host_window == 0) {
    return;
  }
  auto& api = window_linux_api();
  constexpr int keyPress = 2;
  constexpr int keyRelease = 3;
  constexpr int buttonPress = 4;
  constexpr int buttonRelease = 5;
  constexpr int motionNotify = 6;
  constexpr int expose = 12;
  constexpr int configureNotify = 22;
  constexpr int clientMessage = 33;
  while (api.pending(window->host_display) > 0) {
    jayess_xevent event{};
    api.next_event(window->host_display, &event);
    if (event.type == configureNotify) {
      window_push_resize_event(window, event.configure.width, event.configure.height);
      continue;
    }
    if (event.type == expose) {
      window->render_requested = true;
      continue;
    }
    if (event.type == keyPress || event.type == keyRelease) {
      const auto keysym = api.lookup_keysym(&event.key, 0);
      window_push_key_event(window, event.type == keyPress ? "keyDown" : "keyUp", window_linux_key_name(keysym));
      continue;
    }
    if (event.type == buttonPress || event.type == buttonRelease) {
      if (event.button.button >= 4U && event.button.button <= 7U) {
        if (event.type == buttonRelease) {
          continue;
        }
        if (event.button.button == 4U) {
          window_push_wheel_event(window, 0.0, -1.0, event.button.x, event.button.y);
          continue;
        }
        if (event.button.button == 5U) {
          window_push_wheel_event(window, 0.0, 1.0, event.button.x, event.button.y);
          continue;
        }
        if (event.button.button == 6U) {
          window_push_wheel_event(window, -1.0, 0.0, event.button.x, event.button.y);
          continue;
        }
        if (event.button.button == 7U) {
          window_push_wheel_event(window, 1.0, 0.0, event.button.x, event.button.y);
          continue;
        }
      }
      window_push_mouse_button_event(window, event.type == buttonPress ? "mouseDown" : "mouseUp", static_cast<int>(event.button.button) - 1, event.button.x, event.button.y);
      continue;
    }
    if (event.type == motionNotify) {
      window_push_mouse_move_event(window, event.motion.x, event.motion.y);
      continue;
    }
    if (event.type == clientMessage && window->host_close_atom != 0 && static_cast<unsigned long>(event.client.data.l[0]) == window->host_close_atom) {
      if (!window->close_requested) {
        window_push_close_event(window);
      }
    }
  }
}
${getWindowWaylandAdapterCppFragment()}

bool window_linux_prefers_wayland() {
  return window_wayland_requested();
}

bool window_platform_available() {
  return window_x11_platform_available() || window_wayland_platform_available();
}

bool window_linux_uses_wayland(const window_ptr& window) {
  return window->adapter == "linux-wayland";
}

bool window_try_wayland_platform_create(const window_ptr& window) {
  if (!window_wayland_platform_available()) {
    return false;
  }
  try {
    window_wayland_platform_create(window);
    return true;
  } catch (const std::exception&) {
    return false;
  }
}

bool window_try_x11_platform_create(const window_ptr& window) {
  if (!window_x11_platform_available()) {
    return false;
  }
  try {
    window_x11_platform_create(window);
    return true;
  } catch (const std::exception&) {
    return false;
  }
}

void window_platform_create(const window_ptr& window) {
  if (window_linux_prefers_wayland()) {
    if (window_try_wayland_platform_create(window) || window_try_x11_platform_create(window)) {
      return;
    }
    throw_window_unavailable("Linux window support could not connect to Wayland or X11 on this host");
  }
  if (window_try_x11_platform_create(window) || window_try_wayland_platform_create(window)) {
    return;
  }
  throw_window_unavailable("Linux window support requires a usable X11 or Wayland adapter on this host");
}

void window_platform_show(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_show(window);
    return;
  }
  window_x11_platform_show(window);
}

void window_platform_hide(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_hide(window);
    return;
  }
  window_x11_platform_hide(window);
}

void window_platform_frame(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_frame(window);
    return;
  }
  window_x11_platform_frame(window);
}

void window_platform_close(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_close(window);
    return;
  }
  window_x11_platform_close(window);
}

void window_platform_set_title(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_set_title(window);
    return;
  }
  window_x11_platform_set_title(window);
}

void window_platform_present(const window_ptr& window, const window_canvas_pixels& canvas) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_present(window, canvas);
    return;
  }
  window_x11_platform_present(window, canvas);
}

void window_platform_poll_events(const window_ptr& window) {
  if (window_linux_uses_wayland(window)) {
    window_wayland_platform_poll_events(window);
    return;
  }
  window_x11_platform_poll_events(window);
}
#endif`;
}
