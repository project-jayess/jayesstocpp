export function getWindowWaylandBufferCppFragment() {
  return `int window_wayland_create_shm_file(std::size_t size) {
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
    throw_window_adapter_unavailable("Wayland", "shared-memory upload file creation failed");
  }
  auto* mapped = static_cast<unsigned char*>(mmap(nullptr, byteCount, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0));
  if (mapped == MAP_FAILED) {
    close(fd);
    throw_window_adapter_unavailable("Wayland", "shared-memory upload mapping failed");
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
    throw_window_adapter_unavailable("Wayland", "wl_shm_pool creation failed");
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
    throw_window_adapter_unavailable("Wayland", "wl_buffer creation failed");
  }
  host->buffer = buffer;
  host->mapped_pixels = mapped;
  host->mapped_size = byteCount;
  host->buffer_fd = fd;
  host->buffer_width = width;
  host->buffer_height = height;
  return true;
}`;
}
