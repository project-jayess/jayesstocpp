export function getGpuMetalAdapterCppFragment() {
  return `bool gpu_metal_available() {
  return false;
}

void gpu_metal_clear_frame(const gpu_ptr&) {
  throw_gpu_unavailable("metal");
}`;
}
