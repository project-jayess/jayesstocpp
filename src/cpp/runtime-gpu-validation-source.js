export function getGpuValidationAdapterCppFragment() {
  return `bool gpu_validation_available() {
  return true;
}

void gpu_validation_clear_frame(const gpu_ptr&) {}
`;
}
