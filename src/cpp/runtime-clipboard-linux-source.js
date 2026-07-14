export function getClipboardLinuxAdapterCppFragment() {
  return `#if !defined(_WIN32) && !defined(__APPLE__)
using jayess_clipboard_xinit_threads_fn = int (*)();
using jayess_clipboard_xopen_display_fn = void* (*)(const char*);
using jayess_clipboard_xdefault_screen_fn = int (*)(void*);
using jayess_clipboard_xroot_window_fn = unsigned long (*)(void*, int);
using jayess_clipboard_xcreate_simple_window_fn = unsigned long (*)(void*, unsigned long, int, int, unsigned int, unsigned int, unsigned int, unsigned long, unsigned long);
using jayess_clipboard_xdestroy_window_fn = int (*)(void*, unsigned long);
using jayess_clipboard_xclose_display_fn = int (*)(void*);
using jayess_clipboard_xintern_atom_fn = unsigned long (*)(void*, const char*, int);
using jayess_clipboard_xset_selection_owner_fn = int (*)(void*, unsigned long, unsigned long, unsigned long);
using jayess_clipboard_xget_selection_owner_fn = unsigned long (*)(void*, unsigned long);
using jayess_clipboard_xchange_property_fn = int (*)(void*, unsigned long, unsigned long, unsigned long, int, int, const unsigned char*, int);
using jayess_clipboard_xsend_event_fn = int (*)(void*, unsigned long, int, long, void*);
using jayess_clipboard_xflush_fn = int (*)(void*);
using jayess_clipboard_xnext_event_fn = int (*)(void*, void*);

struct jayess_clipboard_xselection_request_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long owner;
  unsigned long requestor;
  unsigned long selection;
  unsigned long target;
  unsigned long property;
  unsigned long time;
};

struct jayess_clipboard_xselection_event {
  int type;
  unsigned long serial;
  int send_event;
  void* display;
  unsigned long requestor;
  unsigned long selection;
  unsigned long target;
  unsigned long property;
  unsigned long time;
};

union jayess_clipboard_xevent {
  int type;
  jayess_clipboard_xselection_request_event selection_request;
  jayess_clipboard_xselection_event selection;
  long padding[24];
};

struct jayess_clipboard_linux_api {
  void* library = nullptr;
  jayess_clipboard_xinit_threads_fn init_threads = nullptr;
  jayess_clipboard_xopen_display_fn open_display = nullptr;
  jayess_clipboard_xdefault_screen_fn default_screen = nullptr;
  jayess_clipboard_xroot_window_fn root_window = nullptr;
  jayess_clipboard_xcreate_simple_window_fn create_simple_window = nullptr;
  jayess_clipboard_xdestroy_window_fn destroy_window = nullptr;
  jayess_clipboard_xclose_display_fn close_display = nullptr;
  jayess_clipboard_xintern_atom_fn intern_atom = nullptr;
  jayess_clipboard_xset_selection_owner_fn set_selection_owner = nullptr;
  jayess_clipboard_xget_selection_owner_fn get_selection_owner = nullptr;
  jayess_clipboard_xchange_property_fn change_property = nullptr;
  jayess_clipboard_xsend_event_fn send_event = nullptr;
  jayess_clipboard_xflush_fn flush = nullptr;
  jayess_clipboard_xnext_event_fn next_event = nullptr;
  bool attempted = false;
};

struct jayess_clipboard_linux_state {
  void* display = nullptr;
  unsigned long window = 0;
  unsigned long clipboard_atom = 0;
  unsigned long targets_atom = 0;
  unsigned long utf8_atom = 0;
  unsigned long string_atom = 31;
  std::string text;
  std::mutex text_mutex;
  std::thread service_thread;
  bool running = false;
};

jayess_clipboard_linux_api& clipboard_linux_api() {
  static jayess_clipboard_linux_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.library = dlopen("libX11.so.6", RTLD_LAZY | RTLD_LOCAL);
  if (api.library == nullptr) {
    return api;
  }
  api.init_threads = reinterpret_cast<jayess_clipboard_xinit_threads_fn>(dlsym(api.library, "XInitThreads"));
  if (api.init_threads != nullptr) {
    api.init_threads();
  }
  api.open_display = reinterpret_cast<jayess_clipboard_xopen_display_fn>(dlsym(api.library, "XOpenDisplay"));
  api.default_screen = reinterpret_cast<jayess_clipboard_xdefault_screen_fn>(dlsym(api.library, "XDefaultScreen"));
  api.root_window = reinterpret_cast<jayess_clipboard_xroot_window_fn>(dlsym(api.library, "XRootWindow"));
  api.create_simple_window = reinterpret_cast<jayess_clipboard_xcreate_simple_window_fn>(dlsym(api.library, "XCreateSimpleWindow"));
  api.destroy_window = reinterpret_cast<jayess_clipboard_xdestroy_window_fn>(dlsym(api.library, "XDestroyWindow"));
  api.close_display = reinterpret_cast<jayess_clipboard_xclose_display_fn>(dlsym(api.library, "XCloseDisplay"));
  api.intern_atom = reinterpret_cast<jayess_clipboard_xintern_atom_fn>(dlsym(api.library, "XInternAtom"));
  api.set_selection_owner = reinterpret_cast<jayess_clipboard_xset_selection_owner_fn>(dlsym(api.library, "XSetSelectionOwner"));
  api.get_selection_owner = reinterpret_cast<jayess_clipboard_xget_selection_owner_fn>(dlsym(api.library, "XGetSelectionOwner"));
  api.change_property = reinterpret_cast<jayess_clipboard_xchange_property_fn>(dlsym(api.library, "XChangeProperty"));
  api.send_event = reinterpret_cast<jayess_clipboard_xsend_event_fn>(dlsym(api.library, "XSendEvent"));
  api.flush = reinterpret_cast<jayess_clipboard_xflush_fn>(dlsym(api.library, "XFlush"));
  api.next_event = reinterpret_cast<jayess_clipboard_xnext_event_fn>(dlsym(api.library, "XNextEvent"));
  return api;
}

bool clipboard_linux_api_available() {
  auto& api = clipboard_linux_api();
  return api.open_display != nullptr
    && api.default_screen != nullptr
    && api.root_window != nullptr
    && api.create_simple_window != nullptr
    && api.destroy_window != nullptr
    && api.close_display != nullptr
    && api.intern_atom != nullptr
    && api.set_selection_owner != nullptr
    && api.get_selection_owner != nullptr
    && api.change_property != nullptr
    && api.send_event != nullptr
    && api.flush != nullptr
    && api.next_event != nullptr;
}

jayess_clipboard_linux_state& clipboard_linux_state() {
  static jayess_clipboard_linux_state state;
  return state;
}

void clipboard_linux_send_notify(const jayess_clipboard_xselection_request_event& request, unsigned long property) {
  auto& api = clipboard_linux_api();
  jayess_clipboard_xevent response{};
  response.selection.type = 31;
  response.selection.display = request.display;
  response.selection.requestor = request.requestor;
  response.selection.selection = request.selection;
  response.selection.target = request.target;
  response.selection.property = property;
  response.selection.time = request.time;
  api.send_event(request.display, request.requestor, 0, 0, &response);
  api.flush(request.display);
}

void clipboard_linux_answer_request(const jayess_clipboard_xselection_request_event& request) {
  auto& api = clipboard_linux_api();
  auto& state = clipboard_linux_state();
  constexpr int prop_mode_replace = 0;
  unsigned long property = request.property == 0 ? request.target : request.property;
  if (request.target == state.targets_atom) {
    unsigned long targets[3] = { state.targets_atom, state.utf8_atom, state.string_atom };
    api.change_property(
      request.display,
      request.requestor,
      property,
      state.targets_atom,
      32,
      prop_mode_replace,
      reinterpret_cast<const unsigned char*>(targets),
      3
    );
    clipboard_linux_send_notify(request, property);
    return;
  }

  if (request.target == state.utf8_atom || request.target == state.string_atom) {
    std::string text;
    {
      std::lock_guard<std::mutex> lock(state.text_mutex);
      text = state.text;
    }
    api.change_property(
      request.display,
      request.requestor,
      property,
      request.target,
      8,
      prop_mode_replace,
      reinterpret_cast<const unsigned char*>(text.data()),
      static_cast<int>(text.size())
    );
    clipboard_linux_send_notify(request, property);
    return;
  }

  clipboard_linux_send_notify(request, 0);
}

void clipboard_linux_service() {
  auto& api = clipboard_linux_api();
  auto& state = clipboard_linux_state();
  while (state.running) {
    jayess_clipboard_xevent event{};
    api.next_event(state.display, &event);
    if (event.type == 30) {
      clipboard_linux_answer_request(event.selection_request);
    }
  }
}

bool clipboard_linux_ensure_started() {
  if (!clipboard_linux_api_available()) {
    return false;
  }
  auto& api = clipboard_linux_api();
  auto& state = clipboard_linux_state();
  if (state.display != nullptr && state.window != 0) {
    return true;
  }
  void* display = api.open_display(nullptr);
  if (display == nullptr) {
    return false;
  }
  int screen = api.default_screen(display);
  unsigned long root = api.root_window(display, screen);
  unsigned long window = api.create_simple_window(display, root, 0, 0, 1, 1, 0, 0, 0);
  if (window == 0) {
    api.close_display(display);
    return false;
  }
  state.display = display;
  state.window = window;
  state.clipboard_atom = api.intern_atom(display, "CLIPBOARD", 0);
  state.targets_atom = api.intern_atom(display, "TARGETS", 0);
  state.utf8_atom = api.intern_atom(display, "UTF8_STRING", 0);
  if (state.clipboard_atom == 0 || state.targets_atom == 0 || state.utf8_atom == 0) {
    api.destroy_window(display, window);
    api.close_display(display);
    state.display = nullptr;
    state.window = 0;
    return false;
  }
  state.running = true;
  state.service_thread = std::thread(clipboard_linux_service);
  state.service_thread.detach();
  return true;
}

bool clipboard_platform_available() {
  return clipboard_linux_ensure_started();
}

std::string clipboard_platform_read_text() {
  if (!clipboard_linux_ensure_started()) {
    throw_clipboard_unavailable();
  }
  auto& state = clipboard_linux_state();
  auto& api = clipboard_linux_api();
  if (api.get_selection_owner(state.display, state.clipboard_atom) != state.window) {
    throw std::runtime_error("Jayess clipboard Linux adapter can only read text copied by this process for now");
  }
  std::lock_guard<std::mutex> lock(state.text_mutex);
  return state.text;
}

bool clipboard_platform_write_text(const std::string& text) {
  if (!clipboard_linux_ensure_started()) {
    throw_clipboard_unavailable();
  }
  auto& state = clipboard_linux_state();
  auto& api = clipboard_linux_api();
  {
    std::lock_guard<std::mutex> lock(state.text_mutex);
    state.text = text;
  }
  api.set_selection_owner(state.display, state.clipboard_atom, state.window, 0);
  if (api.get_selection_owner(state.display, state.clipboard_atom) != state.window) {
    throw std::runtime_error("Jayess clipboard Linux adapter could not own the X11 clipboard");
  }
  api.flush(state.display);
  return true;
}

bool clipboard_platform_clear() {
  if (!clipboard_linux_ensure_started()) {
    throw_clipboard_unavailable();
  }
  auto& state = clipboard_linux_state();
  auto& api = clipboard_linux_api();
  {
    std::lock_guard<std::mutex> lock(state.text_mutex);
    state.text = std::string();
  }
  api.set_selection_owner(state.display, state.clipboard_atom, 0, 0);
  api.flush(state.display);
  return true;
}
#endif`;
}
