export function getGpuOpenGLAdapterCppFragment() {
  return `using jayess_gl_clear_color_fn = void (*)(float, float, float, float);
using jayess_gl_clear_fn = void (*)(unsigned int);
using jayess_gl_gen_textures_fn = void (*)(int, unsigned int*);
using jayess_gl_bind_texture_fn = void (*)(unsigned int, unsigned int);
using jayess_gl_tex_parameteri_fn = void (*)(unsigned int, unsigned int, int);
using jayess_gl_tex_image_2d_fn = void (*)(unsigned int, int, int, int, int, int, unsigned int, unsigned int, const void*);

struct jayess_opengl_gpu_api {
  void* library = nullptr;
  jayess_gl_clear_color_fn clear_color = nullptr;
  jayess_gl_clear_fn clear = nullptr;
  jayess_gl_gen_textures_fn gen_textures = nullptr;
  jayess_gl_bind_texture_fn bind_texture = nullptr;
  jayess_gl_tex_parameteri_fn tex_parameteri = nullptr;
  jayess_gl_tex_image_2d_fn tex_image_2d = nullptr;
  bool attempted = false;
};

constexpr unsigned int jayess_gl_color_buffer_bit = 0x00004000U;
constexpr unsigned int jayess_gl_texture_2d = 0x0DE1U;
constexpr unsigned int jayess_gl_rgba = 0x1908U;
constexpr unsigned int jayess_gl_unsigned_byte = 0x1401U;
constexpr unsigned int jayess_gl_texture_min_filter = 0x2801U;
constexpr unsigned int jayess_gl_texture_mag_filter = 0x2800U;
constexpr unsigned int jayess_gl_nearest = 0x2600U;

jayess_opengl_gpu_api& gpu_opengl_api() {
  static jayess_opengl_gpu_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
#if defined(__linux__)
  api.library = dlopen("libGL.so.1", RTLD_LAZY | RTLD_LOCAL);
  if (api.library == nullptr) {
    return api;
  }
  api.clear_color = reinterpret_cast<jayess_gl_clear_color_fn>(dlsym(api.library, "glClearColor"));
  api.clear = reinterpret_cast<jayess_gl_clear_fn>(dlsym(api.library, "glClear"));
  api.gen_textures = reinterpret_cast<jayess_gl_gen_textures_fn>(dlsym(api.library, "glGenTextures"));
  api.bind_texture = reinterpret_cast<jayess_gl_bind_texture_fn>(dlsym(api.library, "glBindTexture"));
  api.tex_parameteri = reinterpret_cast<jayess_gl_tex_parameteri_fn>(dlsym(api.library, "glTexParameteri"));
  api.tex_image_2d = reinterpret_cast<jayess_gl_tex_image_2d_fn>(dlsym(api.library, "glTexImage2D"));
#endif
  return api;
}

bool gpu_opengl_available() {
#if defined(__linux__)
  auto& api = gpu_opengl_api();
  return api.library != nullptr
    && api.clear_color != nullptr
    && api.clear != nullptr
    && api.gen_textures != nullptr
    && api.bind_texture != nullptr
    && api.tex_parameteri != nullptr
    && api.tex_image_2d != nullptr;
#else
  return false;
#endif
}

void gpu_opengl_clear_frame(const gpu_ptr& frame) {
#if defined(__linux__)
  if (!gpu_opengl_available()) {
    throw_gpu_unavailable("opengl");
  }
  auto& api = gpu_opengl_api();
  const auto& color = frame->frame.clear_color;
  api.clear_color(
    static_cast<float>(color[0]) / 255.0F,
    static_cast<float>(color[1]) / 255.0F,
    static_cast<float>(color[2]) / 255.0F,
    static_cast<float>(color[3]) / 255.0F
  );
  api.clear(jayess_gl_color_buffer_bit);
  gpu_present_host_frame(frame);
#else
  throw_gpu_unavailable("opengl");
#endif
}

void gpu_opengl_upload_texture(const gpu_ptr& texture) {
#if defined(__linux__)
  if (!gpu_opengl_available()) {
    throw_gpu_unavailable("opengl");
  }
  if (!texture->texture.initialized || texture->texture.pixels.empty()) {
    return;
  }
  auto& api = gpu_opengl_api();
  if (texture->texture.host_texture == 0) {
    unsigned int id = 0;
    api.gen_textures(1, &id);
    texture->texture.host_texture = id;
  }
  api.bind_texture(jayess_gl_texture_2d, texture->texture.host_texture);
  api.tex_parameteri(jayess_gl_texture_2d, jayess_gl_texture_min_filter, static_cast<int>(jayess_gl_nearest));
  api.tex_parameteri(jayess_gl_texture_2d, jayess_gl_texture_mag_filter, static_cast<int>(jayess_gl_nearest));
  api.tex_image_2d(
    jayess_gl_texture_2d,
    0,
    static_cast<int>(jayess_gl_rgba),
    texture->texture.width,
    texture->texture.height,
    0,
    jayess_gl_rgba,
    jayess_gl_unsigned_byte,
    texture->texture.pixels.data()
  );
#else
  (void)texture;
#endif
}`;
}
