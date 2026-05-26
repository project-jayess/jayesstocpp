import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { skipIfRuntimeUnavailableOutput, transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function gpuOpenGLMain({ header, namespace }) {
  return `#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

template <typename Callback>
std::string thrown_runtime_message(Callback&& callback) {
  try {
    callback();
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();

#if defined(__linux__)
  auto probe = thrown_runtime_message([&]() {
    jayess::gpu_create_device(jayess::make_object({{"backend", std::string("opengl")}}));
  });
  if (probe.find("Jayess GPU backend is not available") != std::string::npos) {
    std::cout << "skip:opengl-unavailable\\n";
    return 0;
  }
  require(probe == "not-thrown", "opengl device probe");

  auto deviceValue = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("opengl")}}));
  auto device = std::get<jayess::gpu_ptr>(deviceValue);
  require(device->backend == "opengl", "opengl device backend");
  require(device->capabilities.available == true, "opengl device available");

  auto window = std::make_shared<jayess::window_state>();
  window->adapter = "linux-x11";
  window->width = 4;
  window->height = 3;
  window->host_display = reinterpret_cast<void*>(static_cast<std::uintptr_t>(1));
  window->host_window = 1;
  auto surfaceValue = jayess::gpu_create_surface(window);
  auto surface = std::get<jayess::gpu_ptr>(surfaceValue);
  require(surface->backend == "opengl", "opengl x11 surface backend");

  auto frameValue = jayess::gpu_begin_frame(surfaceValue);
  auto frame = std::get<jayess::gpu_ptr>(frameValue);
  jayess::gpu_clear(frameValue, jayess::make_object({{"red", 3.0}, {"green", 2.0}, {"blue", 1.0}, {"alpha", 1.0}}));
  jayess::gpu_end_frame(frameValue);
  require(window->presented_width == 4, "opengl clear records presented width");
  require(window->presented_height == 3, "opengl clear records presented height");

  auto textureValue = jayess::gpu_create_texture(deviceValue, jayess::make_object({{"width", 1.0}, {"height", 1.0}}));
  auto image = jayess::image_create(1.0, 1.0, jayess::make_object({{"red", 7.0}, {"green", 8.0}, {"blue", 9.0}, {"alpha", 1.0}}));
  auto uploaded = jayess::gpu_upload_image(textureValue, image);
  auto texture = std::get<jayess::gpu_ptr>(uploaded);
  require(texture->texture.initialized == true, "opengl texture initialized");
  require(texture->texture.pixels.size() == 4, "opengl texture pixels kept");
  std::cout << "ok\\n";
  return 0;
#else
  std::cout << "skip:opengl-unavailable\\n";
  return 0;
#endif
}
`;
}

runtimeTest("generated C++ probes Linux OpenGL backend clear and texture upload when available", (t) => {
  const output = transpileAndRunFixture(t, "test/fixtures/modules/gpu-upload-main.js", "runtime-gpu-opengl", (_targetDir, entry) => gpuOpenGLMain(entry));
  skipIfRuntimeUnavailableOutput(t, output, "skip:opengl-unavailable", {
    moduleName: "jayess:gpu",
    adapter: "opengl",
    capability: "device and surface probe"
  });
});
