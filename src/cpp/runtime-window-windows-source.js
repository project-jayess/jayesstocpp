export function getWindowWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
using jayess_hwnd = HWND;
using jayess_hinstance = HINSTANCE;
using jayess_hdc = HDC;
using jayess_hmodule = HMODULE;
using jayess_hicon = HICON;
using jayess_hcursor = HCURSOR;
using jayess_hbrush = HBRUSH;
using jayess_lresult = std::intptr_t;
using jayess_wparam = std::uintptr_t;
using jayess_lparam = std::intptr_t;
using jayess_atom = unsigned short;
using jayess_dword = unsigned long;
using jayess_word = unsigned short;
using jayess_long = long;
using jayess_uint = unsigned int;
using jayess_wnd_proc = jayess_lresult (*)(jayess_hwnd, jayess_uint, jayess_wparam, jayess_lparam);

struct jayess_point {
  jayess_long x;
  jayess_long y;
};

struct jayess_rect {
  jayess_long left;
  jayess_long top;
  jayess_long right;
  jayess_long bottom;
};

struct jayess_msg {
  jayess_hwnd hwnd;
  jayess_uint message;
  jayess_wparam wParam;
  jayess_lparam lParam;
  jayess_dword time;
  jayess_point pt;
  jayess_dword lPrivate;
};

struct jayess_wnd_classa {
  jayess_uint cbSize;
  jayess_uint style;
  jayess_wnd_proc lpfnWndProc;
  int cbClsExtra;
  int cbWndExtra;
  jayess_hinstance hInstance;
  jayess_hicon hIcon;
  jayess_hcursor hCursor;
  jayess_hbrush hbrBackground;
  const char* lpszMenuName;
  const char* lpszClassName;
  jayess_hicon hIconSm;
};

struct jayess_bitmapinfoheader {
  jayess_dword biSize;
  jayess_long biWidth;
  jayess_long biHeight;
  jayess_word biPlanes;
  jayess_word biBitCount;
  jayess_dword biCompression;
  jayess_dword biSizeImage;
  jayess_long biXPelsPerMeter;
  jayess_long biYPelsPerMeter;
  jayess_dword biClrUsed;
  jayess_dword biClrImportant;
};

struct jayess_rgbquad {
  unsigned char rgbBlue;
  unsigned char rgbGreen;
  unsigned char rgbRed;
  unsigned char rgbReserved;
};

struct jayess_bitmapinfo {
  jayess_bitmapinfoheader bmiHeader;
  jayess_rgbquad bmiColors[1];
};

using jayess_get_module_handle_a_fn = jayess_hinstance (*)(const char*);
using jayess_register_class_ex_a_fn = jayess_atom (*)(const jayess_wnd_classa*);
using jayess_create_window_ex_a_fn = jayess_hwnd (*)(jayess_dword, const char*, const char*, jayess_dword, int, int, int, int, jayess_hwnd, void*, jayess_hinstance, void*);
using jayess_destroy_window_fn = int (*)(jayess_hwnd);
using jayess_show_window_fn = int (*)(jayess_hwnd, int);
using jayess_update_window_fn = int (*)(jayess_hwnd);
using jayess_set_window_text_a_fn = int (*)(jayess_hwnd, const char*);
using jayess_peek_message_a_fn = int (*)(jayess_msg*, jayess_hwnd, jayess_uint, jayess_uint, jayess_uint);
using jayess_translate_message_fn = int (*)(const jayess_msg*);
using jayess_dispatch_message_a_fn = jayess_lresult (*)(const jayess_msg*);
using jayess_def_window_proc_a_fn = jayess_lresult (*)(jayess_hwnd, jayess_uint, jayess_wparam, jayess_lparam);
using jayess_get_dc_fn = jayess_hdc (*)(jayess_hwnd);
using jayess_release_dc_fn = int (*)(jayess_hwnd, jayess_hdc);
using jayess_stretch_dibits_fn = int (*)(jayess_hdc, int, int, int, int, int, int, int, int, const void*, const jayess_bitmapinfo*, unsigned int, unsigned long);
using jayess_get_client_rect_fn = int (*)(jayess_hwnd, jayess_rect*);
using jayess_pat_blt_fn = int (*)(jayess_hdc, int, int, int, int, unsigned long);

struct jayess_windows_window_api {
  jayess_hmodule user32 = nullptr;
  jayess_hmodule gdi32 = nullptr;
  jayess_get_module_handle_a_fn get_module_handle = nullptr;
  jayess_register_class_ex_a_fn register_class = nullptr;
  jayess_create_window_ex_a_fn create_window = nullptr;
  jayess_destroy_window_fn destroy_window = nullptr;
  jayess_show_window_fn show_window = nullptr;
  jayess_update_window_fn update_window = nullptr;
  jayess_set_window_text_a_fn set_window_text = nullptr;
  jayess_peek_message_a_fn peek_message = nullptr;
  jayess_translate_message_fn translate_message = nullptr;
  jayess_dispatch_message_a_fn dispatch_message = nullptr;
  jayess_def_window_proc_a_fn def_window_proc = nullptr;
  jayess_get_dc_fn get_dc = nullptr;
  jayess_release_dc_fn release_dc = nullptr;
  jayess_stretch_dibits_fn stretch_dibits = nullptr;
  jayess_get_client_rect_fn get_client_rect = nullptr;
  jayess_pat_blt_fn pat_blt = nullptr;
  jayess_hinstance module = nullptr;
  bool attempted = false;
  bool class_registered = false;
};

constexpr jayess_uint jayess_cs_hredraw = 0x0002U;
constexpr jayess_uint jayess_cs_vredraw = 0x0001U;
constexpr jayess_dword jayess_ws_overlapped_window = 0x00cf0000UL;
constexpr int jayess_sw_show = 5;
constexpr jayess_uint jayess_pm_remove = 0x0001U;
constexpr jayess_uint jayess_wm_close = 0x0010U;
constexpr jayess_uint jayess_wm_destroy = 0x0002U;
constexpr jayess_uint jayess_wm_size = 0x0005U;
constexpr jayess_uint jayess_wm_keydown = 0x0100U;
constexpr jayess_uint jayess_wm_keyup = 0x0101U;
constexpr jayess_uint jayess_wm_syskeydown = 0x0104U;
constexpr jayess_uint jayess_wm_syskeyup = 0x0105U;
constexpr jayess_uint jayess_wm_mousemove = 0x0200U;
constexpr jayess_uint jayess_wm_lbuttondown = 0x0201U;
constexpr jayess_uint jayess_wm_lbuttonup = 0x0202U;
constexpr jayess_uint jayess_wm_rbuttondown = 0x0204U;
constexpr jayess_uint jayess_wm_rbuttonup = 0x0205U;
constexpr jayess_uint jayess_wm_mbuttondown = 0x0207U;
constexpr jayess_uint jayess_wm_mbuttonup = 0x0208U;
constexpr jayess_dword jayess_bi_rgb = 0UL;
constexpr unsigned int jayess_dib_rgb_colors = 0U;
constexpr unsigned long jayess_srccopy = 0x00cc0020UL;
constexpr unsigned long jayess_blackness = 0x00000042UL;

const char* window_windows_class_name() {
  return "JayessWindowClass";
}

struct jayess_windows_window_api;
jayess_windows_window_api& window_windows_api();

std::unordered_map<jayess_hwnd, window_ptr>& window_windows_registry() {
  static std::unordered_map<jayess_hwnd, window_ptr> registry;
  return registry;
}

std::mutex& window_windows_registry_mutex() {
  static std::mutex mutex;
  return mutex;
}

std::string window_windows_key_name(jayess_wparam keycode) {
  if (keycode >= 0x30U && keycode <= 0x39U) {
    return std::string(1, static_cast<char>('0' + static_cast<int>(keycode - 0x30U)));
  }
  if (keycode >= 0x41U && keycode <= 0x5aU) {
    return std::string(1, static_cast<char>('A' + static_cast<int>(keycode - 0x41U)));
  }
  if (keycode == 0x1bU) {
    return "Escape";
  }
  if (keycode == 0x0dU) {
    return "Enter";
  }
  if (keycode == 0x09U) {
    return "Tab";
  }
  if (keycode == 0x20U) {
    return " ";
  }
  if (keycode == 0x25U) {
    return "ArrowLeft";
  }
  if (keycode == 0x26U) {
    return "ArrowUp";
  }
  if (keycode == 0x27U) {
    return "ArrowRight";
  }
  if (keycode == 0x28U) {
    return "ArrowDown";
  }
  if (keycode == 0x10U) {
    return "Shift";
  }
  if (keycode == 0x11U) {
    return "Control";
  }
  if (keycode == 0x12U) {
    return "Alt";
  }
  if (keycode == 0x5bU || keycode == 0x5cU) {
    return "Meta";
  }
  return "unknown";
}

jayess_hwnd window_windows_handle(const window_ptr& window) {
  return static_cast<jayess_hwnd>(window->host_display);
}

int window_windows_low_word(jayess_lparam value) {
  return static_cast<int>(static_cast<short>(static_cast<unsigned short>(value & 0xffff)));
}

int window_windows_high_word(jayess_lparam value) {
  return static_cast<int>(static_cast<short>(static_cast<unsigned short>((static_cast<std::uintptr_t>(value) >> 16U) & 0xffffU)));
}

jayess_lresult window_windows_wnd_proc(jayess_hwnd hwnd, jayess_uint message, jayess_wparam wParam, jayess_lparam lParam) {
  window_ptr window;
  {
    std::lock_guard<std::mutex> guard(window_windows_registry_mutex());
    const auto found = window_windows_registry().find(hwnd);
    if (found != window_windows_registry().end()) {
      window = found->second;
    }
  }

  if (window != nullptr) {
    if (message == jayess_wm_close) {
      if (!window->close_requested) {
        window_push_close_event(window);
      }
      return 0;
    }
    if (message == jayess_wm_size) {
      window_push_resize_event(window, window_windows_low_word(lParam), window_windows_high_word(lParam));
      return 0;
    }
    if (message == jayess_wm_keydown || message == jayess_wm_syskeydown || message == jayess_wm_keyup || message == jayess_wm_syskeyup) {
      window_push_key_event(window, (message == jayess_wm_keydown || message == jayess_wm_syskeydown) ? "keyDown" : "keyUp", window_windows_key_name(wParam));
      return 0;
    }
    if (message == jayess_wm_mousemove) {
      window_push_mouse_move_event(window, window_windows_low_word(lParam), window_windows_high_word(lParam));
      return 0;
    }
    if (message == jayess_wm_lbuttondown || message == jayess_wm_lbuttonup) {
      window_push_mouse_button_event(window, message == jayess_wm_lbuttondown ? "mouseDown" : "mouseUp", 0, window_windows_low_word(lParam), window_windows_high_word(lParam));
      return 0;
    }
    if (message == jayess_wm_mbuttondown || message == jayess_wm_mbuttonup) {
      window_push_mouse_button_event(window, message == jayess_wm_mbuttondown ? "mouseDown" : "mouseUp", 1, window_windows_low_word(lParam), window_windows_high_word(lParam));
      return 0;
    }
    if (message == jayess_wm_rbuttondown || message == jayess_wm_rbuttonup) {
      window_push_mouse_button_event(window, message == jayess_wm_rbuttondown ? "mouseDown" : "mouseUp", 2, window_windows_low_word(lParam), window_windows_high_word(lParam));
      return 0;
    }
  }

  auto& api = window_windows_api();
  if (api.def_window_proc != nullptr) {
    return api.def_window_proc(hwnd, message, wParam, lParam);
  }
  return 0;
}

jayess_windows_window_api& window_windows_api() {
  static jayess_windows_window_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.user32 = LoadLibraryA("user32.dll");
  api.gdi32 = LoadLibraryA("gdi32.dll");
  if (api.user32 == nullptr || api.gdi32 == nullptr) {
    return api;
  }
  api.get_module_handle = reinterpret_cast<jayess_get_module_handle_a_fn>(GetProcAddress(LoadLibraryA("kernel32.dll"), "GetModuleHandleA"));
  api.register_class = reinterpret_cast<jayess_register_class_ex_a_fn>(GetProcAddress(api.user32, "RegisterClassExA"));
  api.create_window = reinterpret_cast<jayess_create_window_ex_a_fn>(GetProcAddress(api.user32, "CreateWindowExA"));
  api.destroy_window = reinterpret_cast<jayess_destroy_window_fn>(GetProcAddress(api.user32, "DestroyWindow"));
  api.show_window = reinterpret_cast<jayess_show_window_fn>(GetProcAddress(api.user32, "ShowWindow"));
  api.update_window = reinterpret_cast<jayess_update_window_fn>(GetProcAddress(api.user32, "UpdateWindow"));
  api.set_window_text = reinterpret_cast<jayess_set_window_text_a_fn>(GetProcAddress(api.user32, "SetWindowTextA"));
  api.peek_message = reinterpret_cast<jayess_peek_message_a_fn>(GetProcAddress(api.user32, "PeekMessageA"));
  api.translate_message = reinterpret_cast<jayess_translate_message_fn>(GetProcAddress(api.user32, "TranslateMessage"));
  api.dispatch_message = reinterpret_cast<jayess_dispatch_message_a_fn>(GetProcAddress(api.user32, "DispatchMessageA"));
  api.def_window_proc = reinterpret_cast<jayess_def_window_proc_a_fn>(GetProcAddress(api.user32, "DefWindowProcA"));
  api.get_dc = reinterpret_cast<jayess_get_dc_fn>(GetProcAddress(api.user32, "GetDC"));
  api.release_dc = reinterpret_cast<jayess_release_dc_fn>(GetProcAddress(api.user32, "ReleaseDC"));
  api.get_client_rect = reinterpret_cast<jayess_get_client_rect_fn>(GetProcAddress(api.user32, "GetClientRect"));
  api.stretch_dibits = reinterpret_cast<jayess_stretch_dibits_fn>(GetProcAddress(api.gdi32, "StretchDIBits"));
  api.pat_blt = reinterpret_cast<jayess_pat_blt_fn>(GetProcAddress(api.gdi32, "PatBlt"));
  if (api.get_module_handle != nullptr) {
    api.module = api.get_module_handle(nullptr);
  }
  return api;
}

bool window_platform_available() {
  auto& api = window_windows_api();
  return api.user32 != nullptr
    && api.gdi32 != nullptr
    && api.get_module_handle != nullptr
    && api.register_class != nullptr
    && api.create_window != nullptr
    && api.destroy_window != nullptr
    && api.show_window != nullptr
    && api.update_window != nullptr
    && api.set_window_text != nullptr
    && api.peek_message != nullptr
    && api.translate_message != nullptr
    && api.dispatch_message != nullptr
    && api.def_window_proc != nullptr
    && api.get_dc != nullptr
    && api.release_dc != nullptr
    && api.get_client_rect != nullptr
    && api.stretch_dibits != nullptr
    && api.pat_blt != nullptr
    && api.module != nullptr;
}

void window_windows_ensure_registered() {
  auto& api = window_windows_api();
  if (api.class_registered) {
    return;
  }
  jayess_wnd_classa klass{};
  klass.cbSize = sizeof(jayess_wnd_classa);
  klass.style = jayess_cs_hredraw | jayess_cs_vredraw;
  klass.lpfnWndProc = &window_windows_wnd_proc;
  klass.hInstance = api.module;
  klass.lpszClassName = window_windows_class_name();
  if (api.register_class(&klass) == 0) {
    throw_window_adapter_unavailable("Win32", "RegisterClassExA failed");
  }
  api.class_registered = true;
}

void window_platform_create(const window_ptr& window) {
  auto& api = window_windows_api();
  window_windows_ensure_registered();
  auto hwnd = api.create_window(
    0UL,
    window_windows_class_name(),
    window->title.c_str(),
    jayess_ws_overlapped_window,
    0,
    0,
    window->width,
    window->height,
    nullptr,
    nullptr,
    api.module,
    nullptr
  );
  if (hwnd == nullptr) {
    throw_window_adapter_unavailable("Win32", "CreateWindowExA failed");
  }
  {
    std::lock_guard<std::mutex> guard(window_windows_registry_mutex());
    window_windows_registry().insert_or_assign(hwnd, window);
  }
  window->adapter = "windows-win32";
  window->host_display = hwnd;
  window->host_window = 1;
}

void window_platform_show(const window_ptr& window) {
  auto& api = window_windows_api();
  const auto hwnd = window_windows_handle(window);
  api.show_window(hwnd, jayess_sw_show);
  api.update_window(hwnd);
}

void window_platform_close(const window_ptr& window) {
  if (window->host_display == nullptr) {
    return;
  }
  {
    std::lock_guard<std::mutex> guard(window_windows_registry_mutex());
    window_windows_registry().erase(window_windows_handle(window));
  }
  auto& api = window_windows_api();
  api.destroy_window(window_windows_handle(window));
  window->host_display = nullptr;
  window->host_window = 0;
}

void window_platform_set_title(const window_ptr& window) {
  auto& api = window_windows_api();
  api.set_window_text(window_windows_handle(window), window->title.c_str());
}

void window_platform_present(const window_ptr& window, const window_canvas_pixels& canvas) {
  auto& api = window_windows_api();
  if (window->host_display == nullptr) {
    throw_window_adapter_unavailable("Win32", "window handle is not open");
  }
  const auto hwnd = window_windows_handle(window);
  if (canvas.pixels == nullptr || canvas.width <= 0 || canvas.height <= 0) {
    throw std::runtime_error("Jayess window present expects a non-empty canvas image buffer");
  }
  const auto expectedSize = static_cast<std::size_t>(canvas.width) * static_cast<std::size_t>(canvas.height) * 4U;
  if (canvas.pixels->size() < expectedSize) {
    throw std::runtime_error("Jayess window present found an invalid canvas image buffer");
  }
  std::vector<unsigned char> bgra(expectedSize);
  for (std::size_t offset = 0; offset < expectedSize; offset += 4U) {
    bgra[offset] = (*canvas.pixels)[offset + 2U];
    bgra[offset + 1U] = (*canvas.pixels)[offset + 1U];
    bgra[offset + 2U] = (*canvas.pixels)[offset];
    bgra[offset + 3U] = (*canvas.pixels)[offset + 3U];
  }
  jayess_bitmapinfo info{};
  info.bmiHeader.biSize = sizeof(jayess_bitmapinfoheader);
  info.bmiHeader.biWidth = canvas.width;
  info.bmiHeader.biHeight = -canvas.height;
  info.bmiHeader.biPlanes = 1;
  info.bmiHeader.biBitCount = 32;
  info.bmiHeader.biCompression = jayess_bi_rgb;
  info.bmiHeader.biSizeImage = static_cast<jayess_dword>(bgra.size());
  jayess_rect client{};
  int clientWidth = canvas.width;
  int clientHeight = canvas.height;
  if (api.get_client_rect(hwnd, &client) != 0) {
    clientWidth = (std::max)(1, static_cast<int>(client.right - client.left));
    clientHeight = (std::max)(1, static_cast<int>(client.bottom - client.top));
  }
  auto dc = api.get_dc(hwnd);
  if (dc == nullptr) {
    throw_window_adapter_unavailable("Win32", "GetDC failed");
  }
  api.stretch_dibits(
    dc,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
    bgra.data(),
    &info,
    jayess_dib_rgb_colors,
    jayess_srccopy
  );
  if (clientWidth > canvas.width) {
    api.pat_blt(dc, canvas.width, 0, clientWidth - canvas.width, clientHeight, jayess_blackness);
  }
  if (clientHeight > canvas.height) {
    const int bottomWidth = (std::min)(clientWidth, canvas.width);
    api.pat_blt(dc, 0, canvas.height, bottomWidth, clientHeight - canvas.height, jayess_blackness);
  }
  api.release_dc(hwnd, dc);
}

void window_platform_poll_events(const window_ptr& window) {
  if (window->host_display == nullptr) {
    return;
  }
  auto& api = window_windows_api();
  const auto hwnd = window_windows_handle(window);
  jayess_msg message{};
  while (api.peek_message(&message, hwnd, 0U, 0U, jayess_pm_remove) != 0) {
    api.translate_message(&message);
    api.dispatch_message(&message);
  }
}
#endif`;
}
