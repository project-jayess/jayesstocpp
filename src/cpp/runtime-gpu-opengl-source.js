export function getGpuOpenGLAdapterCppFragment() {
  return `bool gpu_opengl_available() {
  return false;
}

void gpu_opengl_clear_frame(const gpu_ptr&) {
  throw_gpu_unavailable("opengl");
}`;
}
