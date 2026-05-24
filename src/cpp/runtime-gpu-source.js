import { getGpuDirect3dAdapterCppFragment } from "./runtime-gpu-direct3d-source.js";
import { getGpuMetalAdapterCppFragment } from "./runtime-gpu-metal-source.js";
import { getGpuOpenGLAdapterCppFragment } from "./runtime-gpu-opengl-source.js";
import { getGpuVulkanAdapterCppFragment } from "./runtime-gpu-vulkan-source.js";

export function getGpuRuntimeHeaderFragment() {
  return `struct gpu_state {
  std::string kind;
  std::string backend;
  bool backend_available = false;
  bool supports_clear = false;
  bool supports_draw = false;
  bool frame_open = false;
  bool frame_ended = false;
  std::vector<std::string> commands;
  std::array<unsigned char, 4> clear_color = {0, 0, 0, 255};
};

value gpu_create_device(const value& options);
value gpu_create_surface(const value& window);
value gpu_create_buffer(const value& device, const value& options);
value gpu_create_texture(const value& device, const value& options);
value gpu_create_shader(const value& device, const value& source);
value gpu_create_pipeline(const value& device, const value& options);
value gpu_begin_frame(const value& surface);
value gpu_clear(const value& frame, const value& color);
value gpu_draw(const value& frame, const value& pipeline, const value& resources);
value gpu_end_frame(const value& frame);`;
}

export function getGpuRuntimeCppFragment() {
  return `namespace {
[[noreturn]] void throw_gpu_unavailable(const std::string& backend);

${getGpuDirect3dAdapterCppFragment()}
${getGpuMetalAdapterCppFragment()}
${getGpuVulkanAdapterCppFragment()}
${getGpuOpenGLAdapterCppFragment()}

[[noreturn]] void throw_gpu_unavailable(const std::string& backend) {
  throw std::runtime_error("Jayess GPU backend is not available: " + backend);
}

gpu_ptr make_gpu_handle(const std::string& kind, const std::string& backend) {
  auto handle = std::make_shared<gpu_state>();
  handle->kind = kind;
  handle->backend = backend;
  handle->backend_available = false;
  handle->supports_clear = false;
  handle->supports_draw = false;
  return handle;
}

struct gpu_backend_capabilities {
  std::string backend;
  bool available = false;
  bool supports_clear = true;
  bool supports_draw = true;
};

gpu_ptr require_gpu_value(const value& input, const std::string& kind) {
  if (!std::holds_alternative<gpu_ptr>(input)) {
    throw_invalid_handle("gpu " + kind, "gpu");
  }
  auto handle = std::get<gpu_ptr>(input);
  if (handle->kind != kind) {
    throw std::runtime_error("Jayess GPU expected " + kind + " handle");
  }
  return handle;
}

object_ptr require_gpu_options(const value& input, const std::string& operation) {
  if (std::holds_alternative<std::monostate>(input)) {
    return std::make_shared<object_value>();
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess GPU " + operation + " expects an options object or null");
  }
  return std::get<object_ptr>(input);
}

std::string gpu_option_string(const object_ptr& options, const std::string& key, const std::string& fallback, const std::string& message) {
  const auto found = options->fields.find(key);
  if (found == options->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<std::string>(found->second)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(found->second);
}

double gpu_option_positive_integer(const object_ptr& options, const std::string& key, double fallback, const std::string& message) {
  const auto found = options->fields.find(key);
  if (found == options->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<double>(found->second)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(found->second);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric <= 0.0) {
    throw std::runtime_error(message);
  }
  return numeric;
}

value require_gpu_color_field(const object_ptr& color, const std::string& field) {
  const auto found = color->fields.find(field);
  if (found == color->fields.end()) {
    throw std::runtime_error("Jayess GPU clear expects a color object with red, green, blue, and alpha");
  }
  return found->second;
}

double require_gpu_color_number(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric)) {
    throw std::runtime_error(message);
  }
  return numeric;
}

unsigned char require_gpu_color_channel(const value& input, const std::string& message) {
  const auto numeric = require_gpu_color_number(input, message);
  if (std::floor(numeric) != numeric || numeric < 0.0 || numeric > 255.0) {
    throw std::runtime_error(message);
  }
  return static_cast<unsigned char>(numeric);
}

unsigned char require_gpu_color_alpha(const value& input) {
  const auto numeric = require_gpu_color_number(input, "Jayess GPU clear alpha must be between 0 and 1");
  if (numeric < 0.0 || numeric > 1.0) {
    throw std::runtime_error("Jayess GPU clear alpha must be between 0 and 1");
  }
  return static_cast<unsigned char>(std::round(numeric * 255.0));
}

std::array<unsigned char, 4> require_gpu_clear_color(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess GPU clear expects a color object");
  }
  const auto color = std::get<object_ptr>(input);
  return {
    require_gpu_color_channel(require_gpu_color_field(color, "red"), "Jayess GPU clear red channel must be an integer between 0 and 255"),
    require_gpu_color_channel(require_gpu_color_field(color, "green"), "Jayess GPU clear green channel must be an integer between 0 and 255"),
    require_gpu_color_channel(require_gpu_color_field(color, "blue"), "Jayess GPU clear blue channel must be an integer between 0 and 255"),
    require_gpu_color_alpha(require_gpu_color_field(color, "alpha"))
  };
}

bool gpu_backend_available(const std::string& backend) {
  if (backend == "direct3d") {
    return gpu_direct3d_available();
  }
  if (backend == "metal") {
    return gpu_metal_available();
  }
  if (backend == "vulkan") {
    return gpu_vulkan_available();
  }
  if (backend == "opengl") {
    return gpu_opengl_available();
  }
  throw std::runtime_error("Jayess GPU backend must be direct3d, metal, vulkan, or opengl");
}

gpu_backend_capabilities gpu_backend_capabilities_for(const std::string& backend) {
  return gpu_backend_capabilities{
    backend,
    gpu_backend_available(backend),
    true,
    true
  };
}

void gpu_apply_capabilities(const gpu_ptr& handle, const gpu_backend_capabilities& capabilities) {
  handle->backend = capabilities.backend;
  handle->backend_available = capabilities.available;
  handle->supports_clear = capabilities.supports_clear;
  handle->supports_draw = capabilities.supports_draw;
}

void require_gpu_frame_open(const gpu_ptr& frame, const std::string& operation) {
  if (!frame->frame_open || frame->frame_ended) {
    throw std::runtime_error("Jayess GPU " + operation + " requires an active frame");
  }
}

void gpu_backend_clear_frame(const gpu_ptr& frame) {
  if (frame->backend == "direct3d") {
    gpu_direct3d_clear_frame(frame);
    return;
  }
  if (frame->backend == "metal") {
    gpu_metal_clear_frame(frame);
    return;
  }
  if (frame->backend == "vulkan") {
    gpu_vulkan_clear_frame(frame);
    return;
  }
  if (frame->backend == "opengl") {
    gpu_opengl_clear_frame(frame);
    return;
  }
  throw_gpu_unavailable(frame->backend);
}
} // namespace

value gpu_create_device(const value& optionsValue) {
  const auto options = require_gpu_options(optionsValue, "createDevice");
  const auto backend = gpu_option_string(options, "backend", "host", "Jayess GPU backend must be a string");
  const auto selected = backend == "host" ? "opengl" : backend;
  const auto capabilities = gpu_backend_capabilities_for(selected);
  if (!capabilities.available) {
    throw_gpu_unavailable(selected);
  }
  auto device = make_gpu_handle("device", selected);
  gpu_apply_capabilities(device, capabilities);
  return device;
}

value gpu_create_surface(const value& windowValue) {
  if (!std::holds_alternative<window_ptr>(windowValue)) {
    throw_invalid_handle("window", "window");
  }
  auto surface = make_gpu_handle("surface", "opengl");
  gpu_apply_capabilities(surface, gpu_backend_capabilities_for("opengl"));
  return surface;
}

value gpu_create_buffer(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createBuffer");
  gpu_option_positive_integer(options, "size", 1.0, "Jayess GPU createBuffer size must be a positive integer");
  gpu_option_string(options, "usage", "", "Jayess GPU createBuffer usage must be a string");
  auto buffer = make_gpu_handle("buffer", device->backend);
  buffer->backend_available = device->backend_available;
  return buffer;
}

value gpu_create_texture(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createTexture");
  gpu_option_positive_integer(options, "width", 1.0, "Jayess GPU createTexture width must be a positive integer");
  gpu_option_positive_integer(options, "height", 1.0, "Jayess GPU createTexture height must be a positive integer");
  auto texture = make_gpu_handle("texture", device->backend);
  texture->backend_available = device->backend_available;
  return texture;
}

value gpu_create_shader(const value& deviceValue, const value& sourceValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  if (!std::holds_alternative<std::string>(sourceValue)) {
    throw std::runtime_error("Jayess GPU createShader expects shader source text");
  }
  if (std::get<std::string>(sourceValue).empty()) {
    throw std::runtime_error("Jayess GPU createShader expects non-empty shader source text");
  }
  auto shader = make_gpu_handle("shader", device->backend);
  shader->backend_available = device->backend_available;
  return shader;
}

value gpu_create_pipeline(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createPipeline");
  const auto shader = options->fields.find("shader");
  if (shader != options->fields.end() && !std::holds_alternative<std::monostate>(shader->second)) {
    require_gpu_value(shader->second, "shader");
  }
  auto pipeline = make_gpu_handle("pipeline", device->backend);
  pipeline->backend_available = device->backend_available;
  pipeline->supports_draw = device->supports_draw;
  return pipeline;
}

value gpu_begin_frame(const value& surfaceValue) {
  const auto surface = require_gpu_value(surfaceValue, "surface");
  auto frame = make_gpu_handle("frame", surface->backend);
  frame->backend_available = surface->backend_available;
  frame->supports_clear = surface->supports_clear;
  frame->supports_draw = surface->supports_draw;
  frame->frame_open = true;
  frame->commands.push_back("beginFrame");
  return frame;
}

value gpu_clear(const value& frameValue, const value& colorValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "clear");
  if (!frame->supports_clear) {
    throw std::runtime_error("Jayess GPU clear is not supported by this backend");
  }
  frame->clear_color = require_gpu_clear_color(colorValue);
  frame->commands.push_back("clear");
  return frameValue;
}

value gpu_draw(const value& frameValue, const value& pipelineValue, const value& resourcesValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "draw");
  const auto pipeline = require_gpu_value(pipelineValue, "pipeline");
  if (!frame->supports_draw || !pipeline->supports_draw) {
    throw std::runtime_error("Jayess GPU draw is not supported by this backend");
  }
  if (!std::holds_alternative<object_ptr>(resourcesValue) && !std::holds_alternative<array_ptr>(resourcesValue) && !std::holds_alternative<std::monostate>(resourcesValue)) {
    throw std::runtime_error("Jayess GPU draw expects resources object, array, or null");
  }
  frame->commands.push_back("draw");
  return frameValue;
}

value gpu_end_frame(const value& frameValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "endFrame");
  if (frame->backend_available && frame->supports_clear) {
    gpu_backend_clear_frame(frame);
  }
  frame->commands.push_back("endFrame");
  frame->frame_open = false;
  frame->frame_ended = true;
  return value(std::monostate{});
}`;
}
