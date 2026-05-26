import { getGpuVulkanLoaderCppFragment } from "./runtime-gpu-vulkan-loader-source.js";
import { getGpuVulkanSurfaceCppFragment } from "./runtime-gpu-vulkan-surface-source.js";

export function getGpuVulkanAdapterCppFragment() {
  return `${getGpuVulkanLoaderCppFragment()}
${getGpuVulkanSurfaceCppFragment()}

bool gpu_vulkan_available() {
#if defined(__linux__)
  auto& api = gpu_vulkan_api();
  return api.library != nullptr
    && api.get_instance_proc_addr != nullptr
    && api.create_instance != nullptr
    && api.destroy_instance != nullptr
    && api.instance_probe_ok;
#else
  return false;
#endif
}

void gpu_vulkan_clear_frame(const gpu_ptr& frame) {
#if defined(__linux__)
  if (!gpu_vulkan_available()) {
    throw_gpu_unavailable("vulkan");
  }
  gpu_vulkan_present_clear_frame(frame);
#else
  (void)frame;
  throw_gpu_unavailable("vulkan");
#endif
}`;
}
