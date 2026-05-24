export function getGpuDirect3dAdapterCppFragment() {
  return `bool gpu_direct3d_available() {
#if defined(_WIN32)
  return true;
#else
  return false;
#endif
}

void gpu_direct3d_clear_frame(const gpu_ptr& frame) {
#if defined(_WIN32)
  gpu_present_host_frame(frame);
#else
  throw_gpu_unavailable("direct3d");
#endif
}`;
}
