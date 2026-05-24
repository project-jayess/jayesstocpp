export function getGpuVulkanAdapterCppFragment() {
  return `bool gpu_vulkan_available() {
  return false;
}

void gpu_vulkan_clear_frame(const gpu_ptr&) {
  throw_gpu_unavailable("vulkan");
}`;
}
