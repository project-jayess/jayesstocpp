export function getWindowMacosAdapterCppFragment() {
  return `#if defined(__APPLE__)
using jayess_objc_id = void*;
using jayess_objc_class = void*;
using jayess_objc_sel = void*;
using jayess_objc_bool = signed char;
using jayess_nsuinteger = unsigned long;
using jayess_nsinteger = long;

struct jayess_ns_point {
  double x;
  double y;
};

struct jayess_ns_size {
  double width;
  double height;
};

struct jayess_ns_rect {
  jayess_ns_point origin;
  jayess_ns_size size;
};

using jayess_objc_get_class_fn = jayess_objc_class (*)(const char*);
using jayess_sel_register_name_fn = jayess_objc_sel (*)(const char*);
using jayess_objc_msg_send_raw_fn = void* (*)();

struct jayess_macos_window_api {
  void* objc_library = nullptr;
  void* appkit_library = nullptr;
  jayess_objc_get_class_fn get_class = nullptr;
  jayess_sel_register_name_fn register_selector = nullptr;
  jayess_objc_msg_send_raw_fn msg_send = nullptr;
  jayess_objc_id default_run_loop_mode = nullptr;
  jayess_objc_id device_rgb_color_space = nullptr;
  bool attempted = false;
};

constexpr jayess_nsuinteger jayess_ns_window_style_titled = 1UL << 0U;
constexpr jayess_nsuinteger jayess_ns_window_style_closable = 1UL << 1U;
constexpr jayess_nsuinteger jayess_ns_window_style_miniaturizable = 1UL << 2U;
constexpr jayess_nsuinteger jayess_ns_window_style_resizable = 1UL << 3U;
constexpr jayess_nsinteger jayess_ns_backing_store_buffered = 2;
constexpr jayess_nsuinteger jayess_ns_event_mask_any = ~static_cast<jayess_nsuinteger>(0);
constexpr jayess_nsuinteger jayess_ns_event_left_mouse_down = 1;
constexpr jayess_nsuinteger jayess_ns_event_left_mouse_up = 2;
constexpr jayess_nsuinteger jayess_ns_event_right_mouse_down = 3;
constexpr jayess_nsuinteger jayess_ns_event_right_mouse_up = 4;
constexpr jayess_nsuinteger jayess_ns_event_mouse_moved = 5;
constexpr jayess_nsuinteger jayess_ns_event_key_down = 10;
constexpr jayess_nsuinteger jayess_ns_event_key_up = 11;
constexpr jayess_nsuinteger jayess_ns_event_other_mouse_down = 25;
constexpr jayess_nsuinteger jayess_ns_event_other_mouse_up = 26;

jayess_macos_window_api& window_macos_api() {
  static jayess_macos_window_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.objc_library = dlopen("/usr/lib/libobjc.A.dylib", RTLD_LAZY | RTLD_LOCAL);
  api.appkit_library = dlopen("/System/Library/Frameworks/AppKit.framework/AppKit", RTLD_LAZY | RTLD_LOCAL);
  if (api.objc_library == nullptr || api.appkit_library == nullptr) {
    return api;
  }
  api.get_class = reinterpret_cast<jayess_objc_get_class_fn>(dlsym(api.objc_library, "objc_getClass"));
  api.register_selector = reinterpret_cast<jayess_sel_register_name_fn>(dlsym(api.objc_library, "sel_registerName"));
  api.msg_send = reinterpret_cast<jayess_objc_msg_send_raw_fn>(dlsym(api.objc_library, "objc_msgSend"));
  api.default_run_loop_mode = *reinterpret_cast<jayess_objc_id*>(dlsym(api.appkit_library, "NSDefaultRunLoopMode"));
  api.device_rgb_color_space = *reinterpret_cast<jayess_objc_id*>(dlsym(api.appkit_library, "NSDeviceRGBColorSpace"));
  return api;
}

bool window_platform_available() {
  auto& api = window_macos_api();
  return api.objc_library != nullptr
    && api.appkit_library != nullptr
    && api.get_class != nullptr
    && api.register_selector != nullptr
    && api.msg_send != nullptr
    && api.default_run_loop_mode != nullptr
    && api.device_rgb_color_space != nullptr;
}

jayess_objc_sel window_macos_selector(const char* name) {
  return window_macos_api().register_selector(name);
}

jayess_objc_id window_macos_autorelease_pool() {
  auto& api = window_macos_api();
  auto poolClass = api.get_class("NSAutoreleasePool");
  auto allocFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto initFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto pool = allocFn(poolClass, window_macos_selector("alloc"));
  return initFn(pool, window_macos_selector("init"));
}

void window_macos_drain_pool(jayess_objc_id pool) {
  if (pool == nullptr) {
    return;
  }
  auto& api = window_macos_api();
  auto drainFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  drainFn(pool, window_macos_selector("drain"));
}

jayess_objc_id window_macos_make_string(const std::string& text) {
  auto& api = window_macos_api();
  auto stringClass = api.get_class("NSString");
  auto allocFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto initUtf8Fn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, const char*)>(api.msg_send);
  auto stringObject = allocFn(stringClass, window_macos_selector("alloc"));
  return initUtf8Fn(stringObject, window_macos_selector("initWithUTF8String:"), text.c_str());
}

std::string window_macos_string_utf8(jayess_objc_id stringObject) {
  if (stringObject == nullptr) {
    return "unknown";
  }
  auto& api = window_macos_api();
  auto utf8Fn = reinterpret_cast<const char* (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  const auto* text = utf8Fn(stringObject, window_macos_selector("UTF8String"));
  if (text == nullptr) {
    return "unknown";
  }
  return text;
}

jayess_objc_id window_macos_application() {
  auto& api = window_macos_api();
  auto applicationClass = api.get_class("NSApplication");
  auto sharedFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  return sharedFn(applicationClass, window_macos_selector("sharedApplication"));
}

jayess_objc_id window_macos_window_object(const window_ptr& window) {
  return static_cast<jayess_objc_id>(window->host_display);
}

jayess_objc_id window_macos_image_view_object(const window_ptr& window) {
  return reinterpret_cast<jayess_objc_id>(static_cast<std::uintptr_t>(window->host_window));
}

jayess_ns_rect window_macos_view_frame(jayess_objc_id viewObject) {
  auto& api = window_macos_api();
  auto frameFn = reinterpret_cast<jayess_ns_rect (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  return frameFn(viewObject, window_macos_selector("frame"));
}

void window_macos_update_resize_state(const window_ptr& window) {
  auto imageView = window_macos_image_view_object(window);
  if (imageView == nullptr) {
    return;
  }
  const auto frame = window_macos_view_frame(imageView);
  const auto width = static_cast<int>(std::lround(frame.size.width));
  const auto height = static_cast<int>(std::lround(frame.size.height));
  if (width > 0 && height > 0 && (width != window->width || height != window->height)) {
    window_push_resize_event(window, width, height);
  }
}

std::string window_macos_key_name(jayess_objc_id eventObject) {
  auto& api = window_macos_api();
  auto stringFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto characters = stringFn(eventObject, window_macos_selector("charactersIgnoringModifiers"));
  auto text = window_macos_string_utf8(characters);
  if (text.empty()) {
    return "unknown";
  }
  if (text == "\x1b") {
    return "Escape";
  }
  if (text == "\r" || text == "\n") {
    return "Enter";
  }
  if (text == "\t") {
    return "Tab";
  }
  if (text == " ") {
    return " ";
  }
  if (text == "\x7f") {
    return "Backspace";
  }
  return std::string(1, text[0]);
}

void window_platform_create(const window_ptr& window) {
  auto& api = window_macos_api();
  auto pool = window_macos_autorelease_pool();
  auto app = window_macos_application();
  auto activationFn = reinterpret_cast<jayess_objc_bool (*)(jayess_objc_id, jayess_objc_sel, jayess_nsinteger)>(api.msg_send);
  auto voidIdFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);
  activationFn(app, window_macos_selector("setActivationPolicy:"), 0);

  auto windowClass = api.get_class("NSWindow");
  auto imageViewClass = api.get_class("NSImageView");
  auto allocFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto initWindowFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, jayess_ns_rect, jayess_nsuinteger, jayess_nsinteger, jayess_objc_bool)>(api.msg_send);
  auto initViewFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, jayess_ns_rect)>(api.msg_send);
  auto boolFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_bool)>(api.msg_send);

  jayess_ns_rect frame{{0.0, 0.0}, {static_cast<double>(window->width), static_cast<double>(window->height)}};
  auto windowObject = allocFn(windowClass, window_macos_selector("alloc"));
  windowObject = initWindowFn(
    windowObject,
    window_macos_selector("initWithContentRect:styleMask:backing:defer:"),
    frame,
    jayess_ns_window_style_titled | jayess_ns_window_style_closable | jayess_ns_window_style_miniaturizable | jayess_ns_window_style_resizable,
    jayess_ns_backing_store_buffered,
    0
  );
  if (windowObject == nullptr) {
    window_macos_drain_pool(pool);
    throw_window_adapter_unavailable("Cocoa", "NSWindow allocation failed");
  }

  auto imageView = allocFn(imageViewClass, window_macos_selector("alloc"));
  imageView = initViewFn(imageView, window_macos_selector("initWithFrame:"), frame);
  voidIdFn(windowObject, window_macos_selector("setContentView:"), imageView);
  boolFn(windowObject, window_macos_selector("setReleasedWhenClosed:"), 0);

  window->adapter = "macos-cocoa";
  window->host_display = windowObject;
  window->host_window = static_cast<unsigned long>(reinterpret_cast<std::uintptr_t>(imageView));

  auto title = window_macos_make_string(window->title);
  voidIdFn(windowObject, window_macos_selector("setTitle:"), title);
  window_macos_drain_pool(pool);
}

void window_platform_show(const window_ptr& window) {
  auto& api = window_macos_api();
  auto pool = window_macos_autorelease_pool();
  auto app = window_macos_application();
  auto windowObject = window_macos_window_object(window);
  auto voidIdFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);
  auto voidBoolFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_bool)>(api.msg_send);
  voidIdFn(windowObject, window_macos_selector("makeKeyAndOrderFront:"), nullptr);
  voidBoolFn(app, window_macos_selector("activateIgnoringOtherApps:"), 1);
  window_macos_drain_pool(pool);
}

void window_platform_close(const window_ptr& window) {
  if (window->host_display == nullptr) {
    return;
  }
  auto& api = window_macos_api();
  auto pool = window_macos_autorelease_pool();
  auto closeFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  closeFn(window_macos_window_object(window), window_macos_selector("close"));
  window->host_display = nullptr;
  window->host_window = 0;
  window_macos_drain_pool(pool);
}

void window_platform_set_title(const window_ptr& window) {
  auto& api = window_macos_api();
  auto pool = window_macos_autorelease_pool();
  auto title = window_macos_make_string(window->title);
  auto setTitleFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);
  setTitleFn(window_macos_window_object(window), window_macos_selector("setTitle:"), title);
  window_macos_drain_pool(pool);
}

void window_platform_present(const window_ptr& window, const window_canvas_pixels& canvas) {
  auto& api = window_macos_api();
  if (window->host_display == nullptr) {
    throw_window_adapter_unavailable("Cocoa", "window handle is not open");
  }
  if (canvas.pixels == nullptr || canvas.width <= 0 || canvas.height <= 0) {
    throw std::runtime_error("Jayess window present expects a non-empty canvas image buffer");
  }
  const auto expectedSize = static_cast<std::size_t>(canvas.width) * static_cast<std::size_t>(canvas.height) * 4U;
  if (canvas.pixels->size() < expectedSize) {
    throw std::runtime_error("Jayess window present found an invalid canvas image buffer");
  }

  auto pool = window_macos_autorelease_pool();
  auto bitmapClass = api.get_class("NSBitmapImageRep");
  auto imageClass = api.get_class("NSImage");
  auto allocFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto initBitmapFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, unsigned char**, jayess_nsinteger, jayess_nsinteger, jayess_nsinteger, jayess_nsinteger, jayess_objc_bool, jayess_objc_bool, jayess_objc_id, jayess_nsuinteger, jayess_nsinteger, jayess_nsinteger)>(api.msg_send);
  auto bitmapDataFn = reinterpret_cast<unsigned char* (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto initImageFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, jayess_ns_size)>(api.msg_send);
  auto addRepFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);
  auto setImageFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);

  unsigned char* planes[5] = {nullptr, nullptr, nullptr, nullptr, nullptr};
  auto bitmap = allocFn(bitmapClass, window_macos_selector("alloc"));
  bitmap = initBitmapFn(
    bitmap,
    window_macos_selector("initWithBitmapDataPlanes:pixelsWide:pixelsHigh:bitsPerSample:samplesPerPixel:hasAlpha:isPlanar:colorSpaceName:bitmapFormat:bytesPerRow:bitsPerPixel:"),
    planes,
    canvas.width,
    canvas.height,
    8,
    4,
    1,
    0,
    api.device_rgb_color_space,
    0,
    canvas.width * 4,
    32
  );
  if (bitmap == nullptr) {
    window_macos_drain_pool(pool);
    throw_window_adapter_unavailable("Cocoa", "NSBitmapImageRep allocation failed");
  }

  auto* destination = bitmapDataFn(bitmap, window_macos_selector("bitmapData"));
  if (destination == nullptr) {
    window_macos_drain_pool(pool);
    throw_window_adapter_unavailable("Cocoa", "NSBitmapImageRep did not expose writable pixel storage");
  }
  std::memcpy(destination, canvas.pixels->data(), expectedSize);

  auto image = allocFn(imageClass, window_macos_selector("alloc"));
  image = initImageFn(image, window_macos_selector("initWithSize:"), jayess_ns_size{static_cast<double>(canvas.width), static_cast<double>(canvas.height)});
  addRepFn(image, window_macos_selector("addRepresentation:"), bitmap);
  setImageFn(window_macos_image_view_object(window), window_macos_selector("setImage:"), image);
  window_macos_update_resize_state(window);
  window_macos_drain_pool(pool);
}

void window_platform_poll_events(const window_ptr& window) {
  if (window->host_display == nullptr) {
    return;
  }
  auto& api = window_macos_api();
  auto pool = window_macos_autorelease_pool();
  auto app = window_macos_application();
  auto nextEventFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel, jayess_nsuinteger, jayess_objc_id, jayess_objc_id, jayess_objc_bool)>(api.msg_send);
  auto sendEventFn = reinterpret_cast<void (*)(jayess_objc_id, jayess_objc_sel, jayess_objc_id)>(api.msg_send);
  auto distantPastFn = reinterpret_cast<jayess_objc_id (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto typeFn = reinterpret_cast<jayess_nsuinteger (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto pointFn = reinterpret_cast<jayess_ns_point (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto integerFn = reinterpret_cast<jayess_nsinteger (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto boolFn = reinterpret_cast<jayess_objc_bool (*)(jayess_objc_id, jayess_objc_sel)>(api.msg_send);
  auto dateClass = api.get_class("NSDate");
  auto distantPast = distantPastFn(dateClass, window_macos_selector("distantPast"));

  while (true) {
    auto event = nextEventFn(
      app,
      window_macos_selector("nextEventMatchingMask:untilDate:inMode:dequeue:"),
      jayess_ns_event_mask_any,
      distantPast,
      api.default_run_loop_mode,
      1
    );
    if (event == nullptr) {
      break;
    }
    const auto type = typeFn(event, window_macos_selector("type"));
    if (type == jayess_ns_event_key_down || type == jayess_ns_event_key_up) {
      window_push_key_event(window, type == jayess_ns_event_key_down ? "keyDown" : "keyUp", window_macos_key_name(event));
    } else if (type == jayess_ns_event_mouse_moved) {
      const auto point = pointFn(event, window_macos_selector("locationInWindow"));
      window_push_mouse_move_event(window, static_cast<int>(std::lround(point.x)), static_cast<int>(std::lround(point.y)));
    } else if (type == jayess_ns_event_left_mouse_down || type == jayess_ns_event_left_mouse_up || type == jayess_ns_event_right_mouse_down || type == jayess_ns_event_right_mouse_up || type == jayess_ns_event_other_mouse_down || type == jayess_ns_event_other_mouse_up) {
      const auto point = pointFn(event, window_macos_selector("locationInWindow"));
      const auto button = static_cast<int>(integerFn(event, window_macos_selector("buttonNumber")));
      window_push_mouse_button_event(
        window,
        (type == jayess_ns_event_left_mouse_down || type == jayess_ns_event_right_mouse_down || type == jayess_ns_event_other_mouse_down) ? "mouseDown" : "mouseUp",
        button,
        static_cast<int>(std::lround(point.x)),
        static_cast<int>(std::lround(point.y))
      );
    }
    sendEventFn(app, window_macos_selector("sendEvent:"), event);
  }

  window_macos_update_resize_state(window);
  const auto visible = boolFn(window_macos_window_object(window), window_macos_selector("isVisible"));
  if (!visible && !window->close_requested) {
    window_push_close_event(window);
  }
  window_macos_drain_pool(pool);
}
#endif`;
}
