export function getGpuVulkanSurfaceCppFragment() {
  return `bool gpu_vulkan_surface_compatible(const window_ptr& window) {
#if defined(__linux__)
  if (window == nullptr) {
    return false;
  }
  if (window->adapter == "linux-x11") {
    return window->host_display != nullptr && window->host_window != 0;
  }
  if (window->adapter == "linux-wayland") {
    return window->host_display != nullptr;
  }
#else
  (void)window;
#endif
  return false;
}

void gpu_vulkan_present_clear_frame(const gpu_ptr& frame) {
#if defined(__linux__)
  gpu_present_host_frame(frame);
#else
  (void)frame;
  throw_gpu_unavailable("vulkan");
#endif
}`;
}
