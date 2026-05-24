export function getGpuMetalAdapterCppFragment() {
  return `bool gpu_metal_available() {
#if defined(__APPLE__)
  return true;
#else
  return false;
#endif
}

void gpu_metal_clear_frame(const gpu_ptr& frame) {
#if defined(__APPLE__)
  gpu_present_host_frame(frame);
#else
  throw_gpu_unavailable("metal");
#endif
}`;
}
