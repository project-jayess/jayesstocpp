import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function gpuMain({ header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
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
  auto validationDevice = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("validation")}}));
  auto validationHandle = std::get<jayess::gpu_ptr>(validationDevice);
  require(validationHandle->kind == "device", "gpu validation device handle");
  require(validationHandle->backend == "validation", "gpu validation device backend");
  require(validationHandle->capabilities.available == true, "gpu validation device availability");
  auto validationSurface = std::make_shared<jayess::gpu_state>();
  validationSurface->kind = "surface";
  validationSurface->backend = "validation";
  validationSurface->capabilities.available = true;
  validationSurface->capabilities.supports_clear = true;
  validationSurface->capabilities.supports_draw = true;
  auto validationFrameValue = jayess::gpu_begin_frame(validationSurface);
  auto validationFrame = std::get<jayess::gpu_ptr>(validationFrameValue);
  require(validationFrame->frame.commands.size() == 1, "gpu validation beginFrame command recorded");
  jayess::gpu_clear(validationFrame, jayess::make_object({{"red", 9.0}, {"green", 8.0}, {"blue", 7.0}, {"alpha", 1.0}}));
  auto validationPipelineValue = jayess::gpu_create_pipeline(validationDevice, jayess::make_object({}));
  auto validationPipeline = std::get<jayess::gpu_ptr>(validationPipelineValue);
  jayess::gpu_draw(validationFrame, validationPipeline, jayess::value(std::monostate{}));
  jayess::gpu_end_frame(validationFrame);
  require(validationFrame->frame.commands.size() == 4, "gpu validation frame command count");
  require(validationFrame->frame.commands[0] == "beginFrame", "gpu validation beginFrame command name");
  require(validationFrame->frame.commands[1] == "clear", "gpu validation clear command name");
  require(validationFrame->frame.commands[2] == "draw", "gpu validation draw command name");
  require(validationFrame->frame.commands[3] == "endFrame", "gpu validation endFrame command name");
  auto frame = std::make_shared<jayess::gpu_state>();
  frame->kind = "frame";
  frame->backend = "test";
  frame->frame.open = true;
  frame->capabilities.supports_clear = true;
  frame->capabilities.supports_draw = true;
  auto clearResult = jayess::gpu_clear(frame, jayess::make_object({{"red", 1.0}, {"green", 2.0}, {"blue", 3.0}, {"alpha", 1.0}}));
  require(std::get<jayess::gpu_ptr>(clearResult) == frame, "gpu clear result");
  require(frame->frame.clear_color[0] == 1, "gpu clear red");
  require(frame->frame.clear_color[1] == 2, "gpu clear green");
  require(frame->frame.clear_color[2] == 3, "gpu clear blue");
  require(frame->frame.clear_color[3] == 255, "gpu clear alpha");
  require(frame->frame.commands.size() == 1, "gpu clear command recorded");
  require(frame->frame.commands[0] == "clear", "gpu clear command name");
  auto pipeline = std::make_shared<jayess::gpu_state>();
  pipeline->kind = "pipeline";
  pipeline->backend = "test";
  pipeline->capabilities.supports_draw = true;
  jayess::gpu_draw(frame, pipeline, jayess::value(std::monostate{}));
  require(frame->frame.commands.size() == 2, "gpu draw command recorded");
  require(frame->frame.commands[1] == "draw", "gpu draw command name");
  jayess::gpu_end_frame(frame);
  require(frame->frame.ended == true, "gpu frame ended");
  require(frame->frame.commands[2] == "endFrame", "gpu endFrame command name");
  auto ended = thrown_runtime_message([&]() {
    jayess::gpu_clear(frame, jayess::make_object({{"red", 1.0}, {"green", 2.0}, {"blue", 3.0}, {"alpha", 1.0}}));
  });
  require(ended.find("active frame") != std::string::npos, "gpu ended frame diagnostic");
  auto colorFrame = std::make_shared<jayess::gpu_state>();
  colorFrame->kind = "frame";
  colorFrame->backend = "test";
  colorFrame->frame.open = true;
  colorFrame->capabilities.supports_clear = true;
  auto badColor = thrown_runtime_message([&]() {
    jayess::gpu_clear(colorFrame, std::string("bad"));
  });
  require(badColor.find("color object") != std::string::npos, "gpu clear color diagnostic");
  auto device = std::make_shared<jayess::gpu_state>();
  device->kind = "device";
  device->backend = "test";
  auto invalidTexture = jayess::gpu_create_texture(device, jayess::make_object({{"width", 2.0}, {"height", 3.0}}));
  auto invalidTextureHandle = std::get<jayess::gpu_ptr>(invalidTexture);
  require(invalidTextureHandle->kind == "texture", "gpu texture handle");
  require(invalidTextureHandle->texture.width == 2, "gpu texture width metadata");
  require(invalidTextureHandle->texture.height == 3, "gpu texture height metadata");
  require(invalidTextureHandle->texture.format == "rgba8unorm", "gpu texture format metadata");
  std::string textureError = "not-thrown";
  try {
    jayess::gpu_create_texture(device, jayess::make_object({{"width", 0.0}}));
  } catch (const std::exception& error) {
    textureError = error.what();
  }
  require(textureError.find("width must be a positive integer") != std::string::npos, "gpu texture width diagnostic");
  auto unavailable = thrown_runtime_message([&]() {
    jayess::gpu_create_device(jayess::make_object({{"backend", std::string("opengl")}}));
  });
  require(unavailable.find("Jayess GPU backend is not available") != std::string::npos, "gpu unavailable diagnostic");
  auto backend = thrown_runtime_message([&]() {
    jayess::gpu_create_device(jayess::make_object({{"backend", std::string("bad")}}));
  });
  require(backend.find("backend must be validation") != std::string::npos, "gpu backend diagnostic");
  auto options = thrown_runtime_message([&]() {
    jayess::gpu_create_device(std::string("bad"));
  });
  require(options.find("options object") != std::string::npos, "gpu options diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ reports GPU backend availability deterministically", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gpu-main.js", "runtime-gpu", (_targetDir, entry) => gpuMain(entry));
});
