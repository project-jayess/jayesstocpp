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
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&), const jayess::value& input) {
  try {
    fn(std::vector<jayess::value>{input});
  } catch (const jayess::thrown_value& error) {
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto frame = std::make_shared<jayess::gpu_state>();
  frame->kind = "frame";
  frame->backend = "test";
  frame->frame_open = true;
  frame->supports_clear = true;
  frame->supports_draw = true;
  auto clearResult = ${namespace}::clearFrame(std::vector<jayess::value>{frame});
  require(std::get<bool>(clearResult) == true, "gpu clear result");
  require(frame->clear_color[0] == 1, "gpu clear red");
  require(frame->clear_color[1] == 2, "gpu clear green");
  require(frame->clear_color[2] == 3, "gpu clear blue");
  require(frame->clear_color[3] == 255, "gpu clear alpha");
  require(frame->commands.size() == 1, "gpu clear command recorded");
  require(frame->commands[0] == "clear", "gpu clear command name");
  auto pipeline = std::make_shared<jayess::gpu_state>();
  pipeline->kind = "pipeline";
  pipeline->backend = "test";
  pipeline->supports_draw = true;
  jayess::gpu_draw(frame, pipeline, jayess::value(std::monostate{}));
  require(frame->commands.size() == 2, "gpu draw command recorded");
  require(frame->commands[1] == "draw", "gpu draw command name");
  jayess::gpu_end_frame(frame);
  require(frame->frame_ended == true, "gpu frame ended");
  require(frame->commands[2] == "endFrame", "gpu endFrame command name");
  auto ended = thrown_message(${namespace}::clearFrame, frame);
  require(ended.find("active frame") != std::string::npos, "gpu ended frame diagnostic");
  auto colorFrame = std::make_shared<jayess::gpu_state>();
  colorFrame->kind = "frame";
  colorFrame->backend = "test";
  colorFrame->frame_open = true;
  colorFrame->supports_clear = true;
  auto badColor = thrown_message(${namespace}::clearWithBadColor, colorFrame);
  require(badColor.find("color object") != std::string::npos, "gpu clear color diagnostic");
  auto device = std::make_shared<jayess::gpu_state>();
  device->kind = "device";
  device->backend = "test";
  auto invalidTexture = jayess::gpu_create_texture(device, jayess::make_object({{"width", 2.0}, {"height", 3.0}}));
  require(std::get<jayess::gpu_ptr>(invalidTexture)->kind == "texture", "gpu texture handle");
  auto textureError = "not-thrown";
  try {
    jayess::gpu_create_texture(device, jayess::make_object({{"width", 0.0}}));
  } catch (const std::exception& error) {
    textureError = error.what();
  }
  require(textureError.find("width must be a positive integer") != std::string::npos, "gpu texture width diagnostic");
  auto unavailable = thrown_message(${namespace}::openGpu);
  require(unavailable.find("Jayess GPU backend is not available") != std::string::npos, "gpu unavailable diagnostic");
  auto backend = thrown_message(${namespace}::invalidBackend);
  require(backend.find("backend must be direct3d") != std::string::npos, "gpu backend diagnostic");
  auto options = thrown_message(${namespace}::invalidOptions);
  require(options.find("options object") != std::string::npos, "gpu options diagnostic");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ reports GPU backend availability deterministically", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gpu-main.js", "runtime-gpu", (_targetDir, entry) => gpuMain(entry));
});
