export function getGpuHostBindingsCppFragment() {
  return `bool gpu_backend_uses_host_draw_bindings(const std::string& backend) {
  return backend == "direct3d" || backend == "metal" || backend == "opengl";
}

std::vector<std::string> gpu_convert_host_draw_bindings(const gpu_ptr& frame, const std::vector<std::string>& bindings) {
  std::vector<std::string> converted;
  if (!gpu_backend_uses_host_draw_bindings(frame->backend)) {
    return converted;
  }
  for (const auto& binding : bindings) {
    converted.push_back(frame->backend + ":" + binding);
  }
  return converted;
}`;
}
