export function getWindowWaylandRegistryCppFragment() {
  return `void window_wayland_wm_base_ping(void* data, xdg_wm_base* wmBase, std::uint32_t serial) {
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
  if (std::strcmp(interfaceName, "wl_seat") == 0 && host->seat == nullptr) {
    host->seat = window_wayland_registry_bind<wl_seat>(api, registry, name, &wayland_wl_seat_interface, window_wayland_bind_version(version, 1));
    static const wl_seat_listener seatListener = {
      window_wayland_seat_capabilities,
      window_wayland_seat_name
    };
    if (host->seat != nullptr) {
      api.proxy_add_listener(
        reinterpret_cast<wl_proxy*>(host->seat),
        reinterpret_cast<void (**)(void)>(const_cast<wl_seat_listener*>(&seatListener)),
        host
      );
    }
    return;
  }
  if (std::strcmp(interfaceName, "xdg_wm_base") == 0 && host->wm_base == nullptr) {
    host->wm_base = window_wayland_registry_bind<xdg_wm_base>(api, registry, name, &wayland_xdg_wm_base_interface, window_wayland_bind_version(version, 6));
  }
}

void window_wayland_registry_global_remove(void*, wl_registry*, std::uint32_t) {}

void window_wayland_add_registry_listener(jayess_wayland_window_host* host) {
  auto& api = window_wayland_api();
  static const wl_registry_listener registryListener = {
    window_wayland_registry_global,
    window_wayland_registry_global_remove
  };
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->registry),
    reinterpret_cast<void (**)(void)>(const_cast<wl_registry_listener*>(&registryListener)),
    host
  );
}

void window_wayland_require_registry_globals(jayess_wayland_window_host* host) {
  if (host->compositor == nullptr) {
    throw_window_adapter_unavailable("Wayland", "wl_compositor global was not advertised");
  }
  if (host->shm == nullptr) {
    throw_window_adapter_unavailable("Wayland", "wl_shm global was not advertised");
  }
  if (host->wm_base == nullptr) {
    throw_window_adapter_unavailable("Wayland", "xdg_wm_base global was not advertised");
  }
}

void window_wayland_require_input_capabilities(jayess_wayland_window_host* host) {
  if (host->seat == nullptr) {
    throw_window_adapter_unavailable("Wayland", "wl_seat global was not advertised for input event support");
  }
  if (host->pointer == nullptr && host->keyboard == nullptr) {
    throw_window_adapter_unavailable("Wayland", "wl_seat did not advertise pointer or keyboard input capabilities");
  }
}

void window_wayland_add_shell_listeners(jayess_wayland_window_host* host) {
  auto& api = window_wayland_api();
  static const xdg_wm_base_listener wmBaseListener = {window_wayland_wm_base_ping};
  static const xdg_surface_listener xdgSurfaceListener = {window_wayland_xdg_surface_configure};
  static const xdg_toplevel_listener xdgToplevelListener = {
    window_wayland_toplevel_configure,
    window_wayland_toplevel_close,
    nullptr,
    nullptr
  };
  api.proxy_add_listener(
    reinterpret_cast<wl_proxy*>(host->wm_base),
    reinterpret_cast<void (**)(void)>(const_cast<xdg_wm_base_listener*>(&wmBaseListener)),
    host
  );
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
}`;
}
