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
  require(validationFrame->frame.commands[2] == "draw:triangles", "gpu validation draw command name");
  require(validationFrame->frame.commands[3] == "endFrame", "gpu validation endFrame command name");
  auto descriptorFrameValue = jayess::gpu_begin_frame(validationSurface);
  auto descriptorFrame = std::get<jayess::gpu_ptr>(descriptorFrameValue);
  auto descriptorBufferValue = jayess::gpu_create_buffer(validationDevice, jayess::make_object({{"size", 4.0}, {"usage", std::string("vertex")}}));
  auto descriptorTextureValue = jayess::gpu_create_texture(validationDevice, jayess::make_object({{"width", 1.0}, {"height", 1.0}}));
  auto descriptorImage = std::make_shared<jayess::image_state>();
  descriptorImage->width = 1;
  descriptorImage->height = 1;
  descriptorImage->pixels = {255, 0, 0, 255};
  jayess::gpu_upload_image(descriptorTextureValue, descriptorImage);
  jayess::gpu_draw(
    descriptorFrame,
    validationPipeline,
    jayess::make_object({
      {"vertexBuffers", jayess::make_array({jayess::make_object({{"slot", 0.0}, {"buffer", descriptorBufferValue}})})},
      {"textures", jayess::make_array({jayess::make_object({{"slot", 1.0}, {"texture", descriptorTextureValue}})})}
    })
  );
  require(descriptorFrame->frame.resource_bindings.size() == 2, "gpu descriptor binding count");
  require(descriptorFrame->frame.resource_bindings[0] == "vertexBuffer:0:4", "gpu vertex buffer descriptor metadata");
  require(descriptorFrame->frame.resource_bindings[1] == "texture:1:1x1", "gpu texture descriptor metadata");
  require(descriptorFrame->frame.commands.size() == 4, "gpu descriptor command count");
  require(descriptorFrame->frame.commands[1] == "draw:triangles", "gpu descriptor draw command");
  require(descriptorFrame->frame.commands[2] == "bind:vertexBuffer:0:4", "gpu descriptor vertex bind command");
  require(descriptorFrame->frame.commands[3] == "bind:texture:1:1x1", "gpu descriptor texture bind command");
  auto hostFrame = std::make_shared<jayess::gpu_state>();
  hostFrame->kind = "frame";
  hostFrame->backend = "direct3d";
  hostFrame->frame.open = true;
  hostFrame->capabilities.supports_draw = true;
  auto hostPipeline = std::make_shared<jayess::gpu_state>();
  hostPipeline->kind = "pipeline";
  hostPipeline->backend = "direct3d";
  hostPipeline->capabilities.supports_draw = true;
  hostPipeline->pipeline.primitive = "triangles";
  auto hostBuffer = std::make_shared<jayess::gpu_state>();
  hostBuffer->kind = "buffer";
  hostBuffer->backend = "direct3d";
  hostBuffer->buffer.usage = "vertex";
  hostBuffer->buffer.size = 8;
  auto hostTexture = std::make_shared<jayess::gpu_state>();
  hostTexture->kind = "texture";
  hostTexture->backend = "direct3d";
  hostTexture->texture.width = 2;
  hostTexture->texture.height = 2;
  hostTexture->texture.initialized = true;
  jayess::gpu_draw(
    hostFrame,
    hostPipeline,
    jayess::make_object({
      {"vertexBuffers", jayess::make_array({jayess::make_object({{"slot", 2.0}, {"buffer", hostBuffer}})})},
      {"textures", jayess::make_array({jayess::make_object({{"slot", 3.0}, {"texture", hostTexture}})})}
    })
  );
  require(hostFrame->frame.commands.size() == 5, "gpu host descriptor command count");
  require(hostFrame->frame.commands[1] == "bind:vertexBuffer:2:8", "gpu host vertex validation binding");
  require(hostFrame->frame.commands[2] == "bind:texture:3:2x2", "gpu host texture validation binding");
  require(hostFrame->frame.commands[3] == "hostBind:direct3d:vertexBuffer:2:8", "gpu host vertex binding conversion");
  require(hostFrame->frame.commands[4] == "hostBind:direct3d:texture:3:2x2", "gpu host texture binding conversion");
  auto uninitializedTexture = jayess::gpu_create_texture(validationDevice, jayess::make_object({{"width", 1.0}, {"height", 1.0}}));
  auto uninitializedTextureError = thrown_runtime_message([&]() {
    jayess::gpu_draw(
      descriptorFrame,
      validationPipeline,
      jayess::make_object({{"textures", jayess::make_array({jayess::make_object({{"texture", uninitializedTexture}})})}})
    );
  });
  require(uninitializedTextureError.find("initialized texture") != std::string::npos, "gpu uninitialized texture diagnostic");
  auto wrongVertexBinding = thrown_runtime_message([&]() {
    jayess::gpu_draw(
      descriptorFrame,
      validationPipeline,
      jayess::make_object({{"vertexBuffers", jayess::make_array({jayess::make_object({{"buffer", descriptorTextureValue}})})}})
    );
  });
  require(wrongVertexBinding.find("expected buffer handle") != std::string::npos, "gpu wrong vertex resource diagnostic");
  auto backendMismatchBuffer = std::make_shared<jayess::gpu_state>();
  backendMismatchBuffer->kind = "buffer";
  backendMismatchBuffer->backend = "other";
  backendMismatchBuffer->buffer.usage = "vertex";
  backendMismatchBuffer->buffer.size = 4;
  auto backendMismatch = thrown_runtime_message([&]() {
    jayess::gpu_draw(
      descriptorFrame,
      validationPipeline,
      jayess::make_object({{"vertexBuffers", jayess::make_array({jayess::make_object({{"buffer", backendMismatchBuffer}})})}})
    );
  });
  require(backendMismatch.find("buffer backend to match") != std::string::npos, "gpu resource backend mismatch diagnostic");
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
  pipeline->pipeline.primitive = "lines";
  jayess::gpu_draw(frame, pipeline, jayess::value(std::monostate{}));
  require(frame->frame.commands.size() == 2, "gpu draw command recorded");
  require(frame->frame.commands[1] == "draw:lines", "gpu draw command name");
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
  auto bufferValue = jayess::gpu_create_buffer(device, jayess::make_object({{"size", 4.0}, {"usage", std::string("vertex")}}));
  auto buffer = std::get<jayess::gpu_ptr>(bufferValue);
  require(buffer->buffer.size == 4, "gpu buffer size metadata");
  require(buffer->buffer.usage == "vertex", "gpu buffer usage metadata");
  jayess::gpu_upload_buffer(buffer, jayess::make_array({1.0, 2.0, 3.0}));
  require(buffer->buffer.bytes.size() == 4, "gpu buffer storage size");
  require(buffer->buffer.bytes[0] == 1, "gpu buffer uploaded byte zero");
  require(buffer->buffer.bytes[2] == 3, "gpu buffer uploaded byte two");
  require(buffer->buffer.bytes[3] == 0, "gpu buffer upload zero fill");
  auto byteData = std::make_shared<jayess::bytes_value>();
  byteData->items = {9, 8, 7, 6};
  jayess::gpu_upload_buffer(buffer, byteData);
  require(buffer->buffer.bytes[0] == 9, "gpu bytes upload byte zero");
  require(buffer->buffer.bytes[3] == 6, "gpu bytes upload byte three");
  auto tooMuchBufferData = thrown_runtime_message([&]() {
    jayess::gpu_upload_buffer(buffer, jayess::make_array({1.0, 2.0, 3.0, 4.0, 5.0}));
  });
  require(tooMuchBufferData.find("exceeds buffer size") != std::string::npos, "gpu upload bounds diagnostic");
  auto badBufferUsage = thrown_runtime_message([&]() {
    jayess::gpu_create_buffer(device, jayess::make_object({{"usage", std::string("bad")}}));
  });
  require(badBufferUsage.find("usage must be vertex") != std::string::npos, "gpu buffer usage diagnostic");
  auto vertexShaderValue = jayess::gpu_create_shader(
    device,
    jayess::make_object({{"stage", std::string("vertex")}, {"source", std::string("vertex-main")}})
  );
  auto vertexShader = std::get<jayess::gpu_ptr>(vertexShaderValue);
  require(vertexShader->shader.stage == "vertex", "gpu vertex shader stage metadata");
  require(vertexShader->shader.source == "vertex-main", "gpu vertex shader source metadata");
  auto fragmentShaderValue = jayess::gpu_create_shader(
    device,
    jayess::make_object({{"stage", std::string("fragment")}, {"source", std::string("fragment-main")}})
  );
  auto resourcePipelineValue = jayess::gpu_create_pipeline(
    device,
    jayess::make_object({{"vertexShader", vertexShaderValue}, {"fragmentShader", fragmentShaderValue}, {"primitive", std::string("lines")}})
  );
  auto resourcePipeline = std::get<jayess::gpu_ptr>(resourcePipelineValue);
  require(resourcePipeline->pipeline.vertex_shader == vertexShader, "gpu pipeline vertex shader metadata");
  require(resourcePipeline->pipeline.fragment_shader == std::get<jayess::gpu_ptr>(fragmentShaderValue), "gpu pipeline fragment shader metadata");
  require(resourcePipeline->pipeline.primitive == "lines", "gpu pipeline primitive metadata");
  auto badShaderStage = thrown_runtime_message([&]() {
    jayess::gpu_create_shader(device, jayess::make_object({{"stage", std::string("compute")}, {"source", std::string("main")}}));
  });
  require(badShaderStage.find("stage must be vertex or fragment") != std::string::npos, "gpu shader stage diagnostic");
  auto badPipelinePrimitive = thrown_runtime_message([&]() {
    jayess::gpu_create_pipeline(device, jayess::make_object({{"primitive", std::string("points")}}));
  });
  require(badPipelinePrimitive.find("primitive must be triangles or lines") != std::string::npos, "gpu pipeline primitive diagnostic");
  std::string textureError = "not-thrown";
  try {
    jayess::gpu_create_texture(device, jayess::make_object({{"width", 0.0}}));
  } catch (const std::exception& error) {
    textureError = error.what();
  }
  require(textureError.find("width must be a positive integer") != std::string::npos, "gpu texture width diagnostic");
  auto openglProbe = thrown_runtime_message([&]() {
    auto openglDevice = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("opengl")}}));
    auto openglHandle = std::get<jayess::gpu_ptr>(openglDevice);
    require(openglHandle->backend == "opengl", "gpu opengl device backend");
  });
  require(
    openglProbe == "not-thrown" || openglProbe.find("Jayess GPU backend is not available") != std::string::npos,
    "gpu opengl availability or unavailable diagnostic"
  );
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
