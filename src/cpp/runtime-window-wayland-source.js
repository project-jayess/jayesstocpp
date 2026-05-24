export function getWindowWaylandAdapterCppFragment() {
  return `struct wl_proxy;
struct wl_display;
struct wl_registry;
struct wl_compositor;
struct wl_surface;
struct wl_shm;
struct wl_shm_pool;
struct wl_buffer;
struct wl_array;
struct xdg_wm_base;
struct xdg_surface;
struct xdg_toplevel;

struct wl_message {
  const char* name;
  const char* signature;
  const struct wl_interface** types;
};

struct wl_interface {
  const char* name;
  int version;
  int method_count;
  const wl_message* methods;
  int event_count;
  const wl_message* events;
};

struct wl_array {
  std::size_t size;
  std::size_t alloc;
  void* data;
};

struct wl_registry_listener {
  void (*global)(void* data, wl_registry* registry, std::uint32_t name, const char* interface, std::uint32_t version);
  void (*global_remove)(void* data, wl_registry* registry, std::uint32_t name);
};

struct xdg_wm_base_listener {
  void (*ping)(void* data, xdg_wm_base* wmBase, std::uint32_t serial);
};

struct xdg_surface_listener {
  void (*configure)(void* data, xdg_surface* surface, std::uint32_t serial);
};

struct xdg_toplevel_listener {
  void (*configure)(void* data, xdg_toplevel* toplevel, std::int32_t width, std::int32_t height, wl_array* states);
  void (*close)(void* data, xdg_toplevel* toplevel);
  void (*configure_bounds)(void* data, xdg_toplevel* toplevel, std::int32_t width, std::int32_t height);
  void (*wm_capabilities)(void* data, xdg_toplevel* toplevel, wl_array* capabilities);
};

using jayess_wl_display_connect_fn = wl_display* (*)(const char*);
using jayess_wl_display_disconnect_fn = void (*)(wl_display*);
using jayess_wl_display_dispatch_fn = int (*)(wl_display*);
using jayess_wl_display_dispatch_pending_fn = int (*)(wl_display*);
using jayess_wl_display_roundtrip_fn = int (*)(wl_display*);
using jayess_wl_display_flush_fn = int (*)(wl_display*);
using jayess_wl_display_get_registry_fn = wl_registry* (*)(wl_display*);
using jayess_wl_proxy_add_listener_fn = int (*)(wl_proxy*, void (**)(void), void*);
using jayess_wl_proxy_destroy_fn = void (*)(wl_proxy*);
using jayess_wl_proxy_marshal_flags_fn = wl_proxy* (*)(wl_proxy*, std::uint32_t, const wl_interface*, std::uint32_t, std::uint32_t, ...);

struct jayess_wayland_window_api {
  void* library = nullptr;
  jayess_wl_display_connect_fn display_connect = nullptr;
  jayess_wl_display_disconnect_fn display_disconnect = nullptr;
  jayess_wl_display_dispatch_fn display_dispatch = nullptr;
  jayess_wl_display_dispatch_pending_fn display_dispatch_pending = nullptr;
  jayess_wl_display_roundtrip_fn display_roundtrip = nullptr;
  jayess_wl_display_flush_fn display_flush = nullptr;
  jayess_wl_display_get_registry_fn display_get_registry = nullptr;
  jayess_wl_proxy_add_listener_fn proxy_add_listener = nullptr;
  jayess_wl_proxy_destroy_fn proxy_destroy = nullptr;
  jayess_wl_proxy_marshal_flags_fn proxy_marshal_flags = nullptr;
  bool attempted = false;
};

struct jayess_wayland_window_host {
  window_ptr window;
  wl_display* display = nullptr;
  wl_registry* registry = nullptr;
  wl_compositor* compositor = nullptr;
  wl_shm* shm = nullptr;
  xdg_wm_base* wm_base = nullptr;
  wl_surface* surface = nullptr;
  xdg_surface* xdg_surface_object = nullptr;
  xdg_toplevel* xdg_toplevel_object = nullptr;
  wl_buffer* buffer = nullptr;
  unsigned char* mapped_pixels = nullptr;
  std::size_t mapped_size = 0;
  int buffer_fd = -1;
  int buffer_width = 0;
  int buffer_height = 0;
  bool configured = false;
};

constexpr std::uint32_t jayess_wayland_shm_argb8888 = 0x34325241u;
constexpr std::uint32_t jayess_wayland_proxy_destroy_flag = 1u << 0;

const wl_interface wayland_wl_buffer_interface = {"wl_buffer", 1, 1, nullptr, 2, nullptr};
const wl_interface wayland_wl_shm_pool_interface = {"wl_shm_pool", 1, 2, nullptr, 0, nullptr};
const wl_interface wayland_wl_surface_interface = {"wl_surface", 6, 11, nullptr, 2, nullptr};
const wl_interface wayland_wl_compositor_interface = {"wl_compositor", 6, 4, nullptr, 0, nullptr};
const wl_interface wayland_wl_shm_interface = {"wl_shm", 1, 1, nullptr, 1, nullptr};
const wl_interface wayland_xdg_toplevel_interface = {"xdg_toplevel", 6, 14, nullptr, 4, nullptr};
const wl_interface wayland_xdg_surface_interface = {"xdg_surface", 6, 5, nullptr, 1, nullptr};
const wl_interface wayland_xdg_wm_base_interface = {"xdg_wm_base", 6, 4, nullptr, 1, nullptr};
const wl_interface wayland_wl_registry_interface = {"wl_registry", 1, 1, nullptr, 2, nullptr};

jayess_wayland_window_api& window_wayland_api() {
  static jayess_wayland_window_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.library = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_LOCAL);
  if (api.library == nullptr) {
    return api;
  }
  api.display_connect = reinterpret_cast<jayess_wl_display_connect_fn>(dlsym(api.library, "wl_display_connect"));
  api.display_disconnect = reinterpret_cast<jayess_wl_display_disconnect_fn>(dlsym(api.library, "wl_display_disconnect"));
  api.display_dispatch = reinterpret_cast<jayess_wl_display_dispatch_fn>(dlsym(api.library, "wl_display_dispatch"));
  api.display_dispatch_pending = reinterpret_cast<jayess_wl_display_dispatch_pending_fn>(dlsym(api.library, "wl_display_dispatch_pending"));
  api.display_roundtrip = reinterpret_cast<jayess_wl_display_roundtrip_fn>(dlsym(api.library, "wl_display_roundtrip"));
  api.display_flush = reinterpret_cast<jayess_wl_display_flush_fn>(dlsym(api.library, "wl_display_flush"));
  api.display_get_registry = reinterpret_cast<jayess_wl_display_get_registry_fn>(dlsym(api.library, "wl_display_get_registry"));
  api.proxy_add_listener = reinterpret_cast<jayess_wl_proxy_add_listener_fn>(dlsym(api.library, "wl_proxy_add_listener"));
  api.proxy_destroy = reinterpret_cast<jayess_wl_proxy_destroy_fn>(dlsym(api.library, "wl_proxy_destroy"));
  api.proxy_marshal_flags = reinterpret_cast<jayess_wl_proxy_marshal_flags_fn>(dlsym(api.library, "wl_proxy_marshal_flags"));
  return api;
}

bool window_wayland_platform_available() {
  auto& api = window_wayland_api();
  return api.display_connect != nullptr
    && api.display_disconnect != nullptr
    && api.display_dispatch != nullptr
    && api.display_dispatch_pending != nullptr
    && api.display_roundtrip != nullptr
    && api.display_flush != nullptr
    && api.display_get_registry != nullptr
    && api.proxy_add_listener != nullptr
    && api.proxy_destroy != nullptr
    && api.proxy_marshal_flags != nullptr;
}

bool window_wayland_requested() {
  const auto* displayName = std::getenv("WAYLAND_DISPLAY");
  return displayName != nullptr && displayName[0] != '\\0';
}

std::uint32_t window_wayland_bind_version(std::uint32_t offered, std::uint32_t supported) {
  return offered < supported ? offered : supported;
}

template <typename T>
T* window_wayland_registry_bind(jayess_wayland_window_api& api, wl_registry* registry, std::uint32_t name, const wl_interface* interface, std::uint32_t version) {
  return reinterpret_cast<T*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(registry),
    0,
    interface,
    1,
    0,
    name,
    interface->name,
    version,
    interface
  ));
}

void window_wayland_destroy_proxy(jayess_wayland_window_api& api, wl_proxy* proxy, std::uint32_t opcode = 0, bool sendDestroy = false) {
  if (proxy == nullptr) {
    return;
  }
  if (sendDestroy) {
    api.proxy_marshal_flags(proxy, opcode, nullptr, 0, jayess_wayland_proxy_destroy_flag);
    return;
  }
  api.proxy_destroy(proxy);
}

int window_wayland_create_shm_file(std::size_t size) {
  const char* runtimeDir = std::getenv("XDG_RUNTIME_DIR");
  const std::string baseDir = runtimeDir != nullptr && runtimeDir[0] != '\\0'
    ? std::string(runtimeDir)
    : std::string("/tmp");
  std::string templatePath = baseDir + "/jayess-window-XXXXXX";
  std::vector<char> mutablePath(templatePath.begin(), templatePath.end());
  mutablePath.push_back('\\0');
  const int fd = mkstemp(mutablePath.data());
  if (fd < 0) {
    return -1;
  }
  unlink(mutablePath.data());
  if (ftruncate(fd, static_cast<off_t>(size)) != 0) {
    close(fd);
    return -1;
  }
  return fd;
}

void window_wayland_destroy_buffer_storage(jayess_wayland_window_host* host) {
  auto& api = window_wayland_api();
  if (host->buffer != nullptr) {
    window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->buffer), 0, true);
    host->buffer = nullptr;
  }
  if (host->mapped_pixels != nullptr && host->mapped_size > 0) {
    munmap(host->mapped_pixels, host->mapped_size);
    host->mapped_pixels = nullptr;
    host->mapped_size = 0;
  }
  if (host->buffer_fd >= 0) {
    close(host->buffer_fd);
    host->buffer_fd = -1;
  }
  host->buffer_width = 0;
  host->buffer_height = 0;
}

void window_wayland_destroy_host(jayess_wayland_window_host* host) {
  if (host == nullptr) {
    return;
  }
  auto& api = window_wayland_api();
  window_wayland_destroy_buffer_storage(host);
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->xdg_toplevel_object), 0, true);
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->xdg_surface_object), 0, true);
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->surface), 0, true);
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->wm_base), 0, true);
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->shm));
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->compositor));
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(host->registry));
  if (host->display != nullptr) {
    api.display_disconnect(host->display);
    host->display = nullptr;
  }
  delete host;
}

void window_wayland_wm_base_ping(void* data, xdg_wm_base* wmBase, std::uint32_t serial) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  auto& api = window_wayland_api();
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(wmBase), 3, nullptr, 0, 0, serial);
  if (host->display != nullptr) {
    api.display_flush(host->display);
  }
}

void window_wayland_xdg_surface_configure(void* data, xdg_surface* surface, std::uint32_t serial) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  auto& api = window_wayland_api();
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(surface), 4, nullptr, 0, 0, serial);
  host->configured = true;
  if (host->display != nullptr) {
    api.display_flush(host->display);
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
}

void window_wayland_registry_global(void* data, wl_registry* registry, std::uint32_t name, const char* interfaceName, std::uint32_t version) {
  auto* host = static_cast<jayess_wayland_window_host*>(data);
  auto& api = window_wayland_api();
  if (std::strcmp(interfaceName, "wl_compositor") == 0 && host->compositor == nullptr) {
    host->compositor = window_wayland_registry_bind<wl_compositor>(api, registry, name, &wayland_wl_compositor_interface, window_wayland_bind_version(version, 6));
    return;
  }
  if (std::strcmp(interfaceName, "wl_shm") == 0 && host->shm == nullptr) {
    host->shm = window_wayland_registry_bind<wl_shm>(api, registry, name, &wayland_wl_shm_interface, 1);
    return;
  }
  if (std::strcmp(interfaceName, "xdg_wm_base") == 0 && host->wm_base == nullptr) {
    host->wm_base = window_wayland_registry_bind<xdg_wm_base>(api, registry, name, &wayland_xdg_wm_base_interface, window_wayland_bind_version(version, 6));
  }
}

void window_wayland_registry_global_remove(void*, wl_registry*, std::uint32_t) {}

bool window_wayland_allocate_buffer(jayess_wayland_window_host* host, int width, int height) {
  auto& api = window_wayland_api();
  const auto byteCount = static_cast<std::size_t>(width) * static_cast<std::size_t>(height) * 4U;
  if (width <= 0 || height <= 0 || byteCount == 0) {
    return false;
  }
  if (host->buffer != nullptr && host->buffer_width == width && host->buffer_height == height && host->mapped_pixels != nullptr) {
    return true;
  }
  window_wayland_destroy_buffer_storage(host);
  const int fd = window_wayland_create_shm_file(byteCount);
  if (fd < 0) {
    return false;
  }
  auto* mapped = static_cast<unsigned char*>(mmap(nullptr, byteCount, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0));
  if (mapped == MAP_FAILED) {
    close(fd);
    return false;
  }
  auto* pool = reinterpret_cast<wl_shm_pool*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(host->shm),
    0,
    &wayland_wl_shm_pool_interface,
    1,
    0,
    nullptr,
    fd,
    static_cast<std::int32_t>(byteCount)
  ));
  if (pool == nullptr) {
    munmap(mapped, byteCount);
    close(fd);
    return false;
  }
  auto* buffer = reinterpret_cast<wl_buffer*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(pool),
    0,
    &wayland_wl_buffer_interface,
    1,
    0,
    nullptr,
    0,
    width,
    height,
    width * 4,
    jayess_wayland_shm_argb8888
  ));
  window_wayland_destroy_proxy(api, reinterpret_cast<wl_proxy*>(pool), 1, true);
  if (buffer == nullptr) {
    munmap(mapped, byteCount);
    close(fd);
    return false;
  }
  host->buffer = buffer;
  host->mapped_pixels = mapped;
  host->mapped_size = byteCount;
  host->buffer_fd = fd;
  host->buffer_width = width;
  host->buffer_height = height;
  return true;
}

void window_wayland_platform_create(const window_ptr& window) {
  auto& api = window_wayland_api();
  auto* host = new jayess_wayland_window_host();
  host->window = window;
  host->display = api.display_connect(nullptr);
  if (host->display == nullptr) {
    delete host;
    throw_window_adapter_unavailable("Wayland", "wl_display_connect failed");
  }
  host->registry = api.display_get_registry(host->display);
  if (host->registry == nullptr) {
    window_wayland_destroy_host(host);
    throw_window_adapter_unavailable("Wayland", "wl_display_get_registry failed");
  }
  static const wl_registry_listener registryListener = {
    window_wayland_registry_global,
    window_wayland_registry_global_remove
  };
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->registry),
    reinterpret_cast<void (**)(void)>(const_cast<wl_registry_listener*>(&registryListener)),
    host
  );
  api.display_roundtrip(host->display);
  if (host->compositor == nullptr || host->shm == nullptr || host->wm_base == nullptr) {
    window_wayland_destroy_host(host);
    throw_window_adapter_unavailable("Wayland", "required wl_compositor, wl_shm, or xdg_wm_base globals were not advertised");
  }
  static const xdg_wm_base_listener wmBaseListener = {window_wayland_wm_base_ping};
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->wm_base),
    reinterpret_cast<void (**)(void)>(const_cast<xdg_wm_base_listener*>(&wmBaseListener)),
    host
  );
  host->surface = reinterpret_cast<wl_surface*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(host->compositor),
    0,
    &wayland_wl_surface_interface,
    1,
    0,
    nullptr
  ));
  host->xdg_surface_object = reinterpret_cast<xdg_surface*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(host->wm_base),
    2,
    &wayland_xdg_surface_interface,
    1,
    0,
    nullptr,
    host->surface
  ));
  host->xdg_toplevel_object = reinterpret_cast<xdg_toplevel*>(api.proxy_marshal_flags(
    reinterpret_cast<wl_proxy*>(host->xdg_surface_object),
    1,
    &wayland_xdg_toplevel_interface,
    1,
    0,
    nullptr
  ));
  if (host->surface == nullptr || host->xdg_surface_object == nullptr || host->xdg_toplevel_object == nullptr) {
    window_wayland_destroy_host(host);
    throw_window_adapter_unavailable("Wayland", "surface or xdg-shell object creation failed");
  }
  static const xdg_surface_listener xdgSurfaceListener = {window_wayland_xdg_surface_configure};
  static const xdg_toplevel_listener xdgToplevelListener = {
    window_wayland_toplevel_configure,
    window_wayland_toplevel_close,
    nullptr,
    nullptr
  };
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->xdg_surface_object),
    reinterpret_cast<void (**)(void)>(const_cast<xdg_surface_listener*>(&xdgSurfaceListener)),
    host
  );
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->xdg_toplevel_object),
    reinterpret_cast<void (**)(void)>(const_cast<xdg_toplevel_listener*>(&xdgToplevelListener)),
    host
  );
  if (!window->title.empty()) {
    api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->xdg_toplevel_object), 2, nullptr, 0, 0, window->title.c_str());
  }
  window->adapter = "linux-wayland";
  window->host_display = host;
  window->host_window = 0;
  window->host_close_atom = 0;
}

void window_wayland_platform_show(const window_ptr& window) {
  auto& api = window_wayland_api();
  auto* host = static_cast<jayess_wayland_window_host*>(window->host_display);
  if (host == nullptr || host->display == nullptr || host->surface == nullptr) {
    throw_window_adapter_unavailable("Wayland", "window handle is not open");
  }
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->surface), 6, nullptr, 0, 0);
  api.display_flush(host->display);
  api.display_roundtrip(host->display);
}

void window_wayland_platform_close(const window_ptr& window) {
  auto* host = static_cast<jayess_wayland_window_host*>(window->host_display);
  if (host == nullptr) {
    return;
  }
  window_wayland_destroy_host(host);
  window->host_display = nullptr;
  window->host_window = 0;
}

void window_wayland_platform_set_title(const window_ptr& window) {
  auto& api = window_wayland_api();
  auto* host = static_cast<jayess_wayland_window_host*>(window->host_display);
  if (host == nullptr || host->xdg_toplevel_object == nullptr) {
    throw_window_adapter_unavailable("Wayland", "xdg_toplevel handle is not open");
  }
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->xdg_toplevel_object), 2, nullptr, 0, 0, window->title.c_str());
  api.display_flush(host->display);
}

void window_wayland_platform_present(const window_ptr& window, const window_canvas_pixels& canvas) {
  auto& api = window_wayland_api();
  auto* host = static_cast<jayess_wayland_window_host*>(window->host_display);
  if (host == nullptr || host->display == nullptr || host->surface == nullptr) {
    throw_window_adapter_unavailable("Wayland", "window handle is not open");
  }
  if (canvas.pixels == nullptr || canvas.width <= 0 || canvas.height <= 0) {
    throw std::runtime_error("Jayess window present expects a non-empty canvas image buffer");
  }
  const auto expectedSize = static_cast<std::size_t>(canvas.width) * static_cast<std::size_t>(canvas.height) * 4U;
  if (canvas.pixels->size() < expectedSize) {
    throw std::runtime_error("Jayess window present found an invalid canvas image buffer");
  }
  if (!window_wayland_allocate_buffer(host, canvas.width, canvas.height)) {
    throw std::runtime_error("Jayess window present could not allocate image upload buffer");
  }
  for (std::size_t offset = 0; offset < expectedSize; offset += 4U) {
    host->mapped_pixels[offset] = (*canvas.pixels)[offset + 2U];
    host->mapped_pixels[offset + 1U] = (*canvas.pixels)[offset + 1U];
    host->mapped_pixels[offset + 2U] = (*canvas.pixels)[offset];
    host->mapped_pixels[offset + 3U] = (*canvas.pixels)[offset + 3U];
  }
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->surface), 1, nullptr, 0, 0, host->buffer, 0, 0);
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->surface), 9, nullptr, 0, 0, 0, 0, canvas.width, canvas.height);
  api.proxy_marshal_flags(reinterpret_cast<wl_proxy*>(host->surface), 6, nullptr, 0, 0);
  api.display_flush(host->display);
}

void window_wayland_platform_poll_events(const window_ptr& window) {
  auto& api = window_wayland_api();
  auto* host = static_cast<jayess_wayland_window_host*>(window->host_display);
  if (host == nullptr || host->display == nullptr) {
    return;
  }
  api.display_dispatch_pending(host->display);
  api.display_roundtrip(host->display);
  api.display_dispatch_pending(host->display);
}`;
}
