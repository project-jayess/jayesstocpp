#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessGpuCreateDevice(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_device(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessGpuCreateSurface(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_surface(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessGpuCreateBuffer(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_buffer(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessGpuCreateTexture(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_texture(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessGpuCreateShader(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_shader(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessGpuCreatePipeline(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_create_pipeline(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessGpuBeginFrame(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_begin_frame(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessGpuClear(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_clear(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessGpuDraw(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_draw(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessGpuEndFrame(const std::vector<jayess::value>& jayessArgs) {
  return jayess::gpu_end_frame(jayess::argument_at(jayessArgs, 0));
}
