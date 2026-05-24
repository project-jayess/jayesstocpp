export function getGpuDirect3dAdapterCppFragment() {
  return `bool gpu_direct3d_available() {
  return false;
}

void gpu_direct3d_clear_frame(const gpu_ptr&) {
  throw_gpu_unavailable("direct3d");
}`;
}
