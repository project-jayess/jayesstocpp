import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { skipIfRuntimeUnavailableOutput, transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function gpuVulkanMain({ header, namespace }) {
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
    jayess::gpu_create_device(jayess::make_object({{"backend", std::string("vulkan")}}));
  });
  if (probe.find("Jayess GPU backend is not available") != std::string::npos) {
    std::cout << "skip:vulkan-unavailable\\n";
    return 0;
  }
  require(probe == "not-thrown", "vulkan device probe");

  auto deviceValue = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("vulkan")}}));
  auto device = std::get<jayess::gpu_ptr>(deviceValue);
  require(device->backend == "vulkan", "vulkan device backend");
  require(device->capabilities.available == true, "vulkan device available");
  require(device->capabilities.supports_clear == true, "vulkan clear capability");
  require(device->capabilities.supports_draw == false, "vulkan draw capability");

  auto window = std::make_shared<jayess::window_state>();
  window->adapter = "linux-x11";
  window->width = 5;
  window->height = 4;
  window->host_display = reinterpret_cast<void*>(static_cast<std::uintptr_t>(1));
  window->host_window = 1;
  auto surfaceValue = jayess::gpu_create_surface(window);
  auto surface = std::get<jayess::gpu_ptr>(surfaceValue);
  require(surface->backend == "vulkan", "vulkan x11 surface backend");

  auto frameValue = jayess::gpu_begin_frame(surfaceValue);
  auto frame = std::get<jayess::gpu_ptr>(frameValue);
  jayess::gpu_clear(frameValue, jayess::make_object({{"red", 11.0}, {"green", 22.0}, {"blue", 33.0}, {"alpha", 1.0}}));
  jayess::gpu_end_frame(frameValue);
  require(frame->frame.commands.size() == 3, "vulkan frame command count");
  require(frame->frame.commands[1] == "clear", "vulkan clear command name");
  require(window->presented_width == 5, "vulkan clear records presented width");
  require(window->presented_height == 4, "vulkan clear records presented height");

  auto pipelineValue = jayess::gpu_create_pipeline(deviceValue, jayess::make_object({}));
  auto drawProbe = thrown_runtime_message([&]() {
    auto drawFrameValue = jayess::gpu_begin_frame(surfaceValue);
    jayess::gpu_draw(drawFrameValue, pipelineValue, jayess::value(std::monostate{}));
  });
  require(drawProbe.find("draw is not supported") != std::string::npos, "vulkan draw unsupported diagnostic");

  std::cout << "ok\\n";
  return 0;
#else
  std::cout << "skip:vulkan-unavailable\\n";
  return 0;
#endif
}
`;
}

runtimeTest("generated C++ probes Linux Vulkan backend clear path when available", (t) => {
  const output = transpileAndRunFixture(t, "test/fixtures/modules/gpu-main.js", "runtime-gpu-vulkan", (_targetDir, entry) => gpuVulkanMain(entry));
  skipIfRuntimeUnavailableOutput(t, output, "skip:vulkan-unavailable", {
    moduleName: "jayess:gpu",
    adapter: "vulkan",
    capability: "device and surface probe"
  });
});
