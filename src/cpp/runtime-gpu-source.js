import { getGpuValidationAdapterCppFragment } from "./runtime-gpu-validation-source.js";
import { getGpuDirect3dAdapterCppFragment } from "./runtime-gpu-direct3d-source.js";
import { getGpuMetalAdapterCppFragment } from "./runtime-gpu-metal-source.js";
import { getGpuOpenGLAdapterCppFragment } from "./runtime-gpu-opengl-source.js";
import { getGpuVulkanAdapterCppFragment } from "./runtime-gpu-vulkan-source.js";
import { getGpuDrawResourcesCppFragment } from "./runtime-gpu-draw-resources-source.js";
import { getGpuHostBindingsCppFragment } from "./runtime-gpu-host-bindings-source.js";

export function getGpuRuntimeHeaderFragment() {
  return `struct gpu_capabilities {
  bool available = false;
  bool supports_clear = false;
  bool supports_draw = false;
};

struct gpu_surface_state {
  window_ptr window = nullptr;
};

struct gpu_buffer_metadata {
  int size = 0;
  std::string usage;
  std::vector<unsigned char> bytes;
};

struct gpu_texture_metadata {
  int width = 0;
  int height = 0;
  std::string format;
  bool initialized = false;
  unsigned int host_texture = 0;
  std::vector<unsigned char> pixels;
};

struct gpu_frame_state {
  bool open = false;
  bool ended = false;
  std::vector<std::string> commands;
  std::vector<std::string> resource_bindings;
  std::array<unsigned char, 4> clear_color = {0, 0, 0, 255};
  window_ptr present_window = nullptr;
};

struct gpu_shader_metadata {
  std::string stage;
  std::string source;
};

struct gpu_pipeline_metadata {
  gpu_ptr vertex_shader = nullptr;
  gpu_ptr fragment_shader = nullptr;
  std::string primitive;
};

struct gpu_state {
  std::string kind;
  std::string backend;
  gpu_capabilities capabilities;
  gpu_surface_state surface;
  gpu_buffer_metadata buffer;
  gpu_texture_metadata texture;
  gpu_frame_state frame;
  gpu_shader_metadata shader;
  gpu_pipeline_metadata pipeline;
};

value gpu_create_device(const value& options);
value gpu_create_surface(const value& window);
value gpu_create_buffer(const value& device, const value& options);
value gpu_upload_buffer(const value& buffer, const value& data);
value gpu_create_texture(const value& device, const value& options);
value gpu_upload_image(const value& texture, const value& image);
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
void gpu_present_host_frame(const gpu_ptr& frame);

${getGpuValidationAdapterCppFragment()}
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

image_ptr require_gpu_image_value(const value& input) {
  if (!std::holds_alternative<image_ptr>(input)) {
    throw_invalid_handle("image", "image");
  }
  return std::get<image_ptr>(input);
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

std::string require_gpu_buffer_usage(const std::string& usage) {
  if (usage == "vertex" || usage == "index" || usage == "uniform" || usage == "storage") {
    return usage;
  }
  throw std::runtime_error("Jayess GPU createBuffer usage must be vertex, index, uniform, or storage");
}

unsigned char require_gpu_upload_byte(const value& input) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error("Jayess GPU uploadBuffer data items must be integers between 0 and 255");
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0 || numeric > 255.0) {
    throw std::runtime_error("Jayess GPU uploadBuffer data items must be integers between 0 and 255");
  }
  return static_cast<unsigned char>(numeric);
}

std::vector<unsigned char> require_gpu_upload_bytes(const value& input) {
  if (std::holds_alternative<bytes_ptr>(input)) {
    return std::get<bytes_ptr>(input)->items;
  }
  if (std::holds_alternative<array_ptr>(input)) {
    std::vector<unsigned char> output;
    for (const auto& item : std::get<array_ptr>(input)->items) {
      output.push_back(require_gpu_upload_byte(item));
    }
    return output;
  }
  throw std::runtime_error("Jayess GPU uploadBuffer expects jayess:bytes or a numeric array");
}

std::string require_gpu_shader_stage(const std::string& stage) {
  if (stage == "vertex" || stage == "fragment") {
    return stage;
  }
  throw std::runtime_error("Jayess GPU createShader stage must be vertex or fragment");
}

std::string gpu_shader_source_from_value(const value& sourceValue, std::string& stage) {
  if (std::holds_alternative<std::string>(sourceValue)) {
    stage = "vertex";
    return std::get<std::string>(sourceValue);
  }
  if (std::holds_alternative<object_ptr>(sourceValue)) {
    const auto options = std::get<object_ptr>(sourceValue);
    stage = require_gpu_shader_stage(gpu_option_string(options, "stage", "vertex", "Jayess GPU createShader stage must be a string"));
    return gpu_option_string(options, "source", "", "Jayess GPU createShader source must be a string");
  }
  throw std::runtime_error("Jayess GPU createShader expects shader source text or a shader descriptor");
}

std::string require_gpu_pipeline_primitive(const object_ptr& options) {
  const auto primitive = gpu_option_string(options, "primitive", "triangles", "Jayess GPU createPipeline primitive must be a string");
  if (primitive == "triangles" || primitive == "lines") {
    return primitive;
  }
  throw std::runtime_error("Jayess GPU createPipeline primitive must be triangles or lines");
}

gpu_ptr optional_gpu_pipeline_shader(const object_ptr& options, const std::string& key, const std::string& expectedStage) {
  const auto found = options->fields.find(key);
  if (found == options->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return nullptr;
  }
  const auto shader = require_gpu_value(found->second, "shader");
  if (shader->shader.stage != expectedStage) {
    throw std::runtime_error("Jayess GPU createPipeline " + key + " must be a " + expectedStage + " shader");
  }
  return shader;
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
  if (backend == "validation") {
    return gpu_validation_available();
  }
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
  throw std::runtime_error("Jayess GPU backend must be validation, direct3d, metal, vulkan, or opengl");
}

gpu_backend_capabilities gpu_backend_capabilities_for(const std::string& backend) {
  return gpu_backend_capabilities{
    backend,
    gpu_backend_available(backend),
    true,
    backend != "vulkan"
  };
}

void gpu_apply_capabilities(const gpu_ptr& handle, const gpu_backend_capabilities& capabilities) {
  handle->backend = capabilities.backend;
  handle->capabilities.available = capabilities.available;
  handle->capabilities.supports_clear = capabilities.supports_clear;
  handle->capabilities.supports_draw = capabilities.supports_draw;
}

void require_gpu_frame_open(const gpu_ptr& frame, const std::string& operation) {
  if (!frame->frame.open || frame->frame.ended) {
    throw std::runtime_error("Jayess GPU " + operation + " requires an active frame");
  }
}

${getGpuDrawResourcesCppFragment()}

${getGpuHostBindingsCppFragment()}

void gpu_present_host_frame(const gpu_ptr& frame) {
  const auto window = frame->frame.present_window;
  if (window == nullptr) {
    throw std::runtime_error("Jayess GPU frame requires a window-backed surface for host presentation");
  }
  const auto width = window->width > 0 ? window->width : 1;
  const auto height = window->height > 0 ? window->height : 1;
  window->presented_width = width;
  window->presented_height = height;
}

void gpu_backend_clear_frame(const gpu_ptr& frame) {
  if (frame->backend == "validation") {
    gpu_validation_clear_frame(frame);
    return;
  }
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

void gpu_backend_upload_texture(const gpu_ptr& texture) {
  if (texture->backend == "opengl") {
    gpu_opengl_upload_texture(texture);
  }
}
} // namespace

value gpu_create_device(const value& optionsValue) {
  const auto options = require_gpu_options(optionsValue, "createDevice");
  const auto backend = gpu_option_string(options, "backend", "host", "Jayess GPU backend must be a string");
  const auto selected = backend == "host" ? "validation" : backend;
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
  auto surface = make_gpu_handle("surface", "validation");
  surface->surface.window = std::get<window_ptr>(windowValue);
#if defined(_WIN32)
  if (gpu_direct3d_available()) {
    gpu_apply_capabilities(surface, gpu_backend_capabilities_for("direct3d"));
    return surface;
  }
#elif defined(__APPLE__)
  if (gpu_metal_available()) {
    gpu_apply_capabilities(surface, gpu_backend_capabilities_for("metal"));
    return surface;
  }
#elif defined(__linux__)
  const auto window = surface->surface.window;
  if (gpu_vulkan_surface_compatible(window) && gpu_vulkan_available()) {
    gpu_apply_capabilities(surface, gpu_backend_capabilities_for("vulkan"));
    return surface;
  }
  if (window != nullptr && window->adapter == "linux-x11" && window->host_display != nullptr && window->host_window != 0 && gpu_opengl_available()) {
    gpu_apply_capabilities(surface, gpu_backend_capabilities_for("opengl"));
    return surface;
  }
#endif
  gpu_apply_capabilities(surface, gpu_backend_capabilities_for("validation"));
  return surface;
}

value gpu_create_buffer(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createBuffer");
  const auto size = static_cast<int>(gpu_option_positive_integer(options, "size", 1.0, "Jayess GPU createBuffer size must be a positive integer"));
  const auto usage = require_gpu_buffer_usage(gpu_option_string(options, "usage", "vertex", "Jayess GPU createBuffer usage must be a string"));
  auto buffer = make_gpu_handle("buffer", device->backend);
  buffer->capabilities = device->capabilities;
  buffer->buffer.size = size;
  buffer->buffer.usage = usage;
  buffer->buffer.bytes.resize(static_cast<std::size_t>(size), 0);
  return buffer;
}

value gpu_upload_buffer(const value& bufferValue, const value& dataValue) {
  const auto buffer = require_gpu_value(bufferValue, "buffer");
  const auto bytes = require_gpu_upload_bytes(dataValue);
  if (buffer->buffer.size <= 0) {
    throw std::runtime_error("Jayess GPU uploadBuffer requires a buffer created by createBuffer");
  }
  if (bytes.size() > static_cast<std::size_t>(buffer->buffer.size)) {
    throw std::runtime_error("Jayess GPU uploadBuffer data exceeds buffer size");
  }
  std::fill(buffer->buffer.bytes.begin(), buffer->buffer.bytes.end(), 0);
  std::copy(bytes.begin(), bytes.end(), buffer->buffer.bytes.begin());
  return bufferValue;
}

value gpu_create_texture(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createTexture");
  const auto width = static_cast<int>(gpu_option_positive_integer(options, "width", 1.0, "Jayess GPU createTexture width must be a positive integer"));
  const auto height = static_cast<int>(gpu_option_positive_integer(options, "height", 1.0, "Jayess GPU createTexture height must be a positive integer"));
  auto texture = make_gpu_handle("texture", device->backend);
  texture->capabilities = device->capabilities;
  texture->texture.width = width;
  texture->texture.height = height;
  texture->texture.format = "rgba8unorm";
  return texture;
}

value gpu_upload_image(const value& textureValue, const value& imageValue) {
  const auto texture = require_gpu_value(textureValue, "texture");
  const auto image = require_gpu_image_value(imageValue);
  if (texture->texture.width <= 0 || texture->texture.height <= 0) {
    throw std::runtime_error("Jayess GPU uploadImage requires a texture created by createTexture");
  }
  if (image->width != texture->texture.width || image->height != texture->texture.height) {
    throw std::runtime_error("Jayess GPU uploadImage image dimensions must match the target texture");
  }
  texture->texture.pixels = image->pixels;
  texture->texture.initialized = true;
  gpu_backend_upload_texture(texture);
  return textureValue;
}

value gpu_create_shader(const value& deviceValue, const value& sourceValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  std::string stage;
  const auto source = gpu_shader_source_from_value(sourceValue, stage);
  if (source.empty()) {
    throw std::runtime_error("Jayess GPU createShader expects non-empty shader source text");
  }
  auto shader = make_gpu_handle("shader", device->backend);
  shader->capabilities = device->capabilities;
  shader->shader.stage = stage;
  shader->shader.source = source;
  return shader;
}

value gpu_create_pipeline(const value& deviceValue, const value& optionsValue) {
  const auto device = require_gpu_value(deviceValue, "device");
  const auto options = require_gpu_options(optionsValue, "createPipeline");
  auto vertexShader = optional_gpu_pipeline_shader(options, "vertexShader", "vertex");
  auto fragmentShader = optional_gpu_pipeline_shader(options, "fragmentShader", "fragment");
  const auto legacyShader = options->fields.find("shader");
  if (legacyShader != options->fields.end() && !std::holds_alternative<std::monostate>(legacyShader->second)) {
    vertexShader = require_gpu_value(legacyShader->second, "shader");
    if (vertexShader->shader.stage != "vertex") {
      throw std::runtime_error("Jayess GPU createPipeline shader must be a vertex shader");
    }
  }
  const auto primitive = require_gpu_pipeline_primitive(options);
  auto pipeline = make_gpu_handle("pipeline", device->backend);
  pipeline->capabilities = device->capabilities;
  pipeline->pipeline.vertex_shader = vertexShader;
  pipeline->pipeline.fragment_shader = fragmentShader;
  pipeline->pipeline.primitive = primitive;
  return pipeline;
}

value gpu_begin_frame(const value& surfaceValue) {
  const auto surface = require_gpu_value(surfaceValue, "surface");
  auto frame = make_gpu_handle("frame", surface->backend);
  frame->capabilities = surface->capabilities;
  frame->frame.open = true;
  frame->frame.present_window = surface->surface.window;
  frame->frame.commands.push_back("beginFrame");
  return frame;
}

value gpu_clear(const value& frameValue, const value& colorValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "clear");
  if (!frame->capabilities.supports_clear) {
    throw std::runtime_error("Jayess GPU clear is not supported by this backend");
  }
  frame->frame.clear_color = require_gpu_clear_color(colorValue);
  frame->frame.commands.push_back("clear");
  return frameValue;
}

value gpu_draw(const value& frameValue, const value& pipelineValue, const value& resourcesValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "draw");
  const auto pipeline = require_gpu_value(pipelineValue, "pipeline");
  if (!frame->capabilities.supports_draw || !pipeline->capabilities.supports_draw) {
    throw std::runtime_error("Jayess GPU draw is not supported by this backend");
  }
  if (frame->backend != pipeline->backend) {
    throw std::runtime_error("Jayess GPU draw requires pipeline backend to match the active frame backend");
  }
  auto bindings = gpu_validate_draw_resources(frame, resourcesValue);
  auto hostBindings = gpu_convert_host_draw_bindings(frame, bindings);
  frame->frame.resource_bindings = bindings;
  frame->frame.commands.push_back("draw:" + pipeline->pipeline.primitive);
  for (const auto& binding : bindings) {
    frame->frame.commands.push_back("bind:" + binding);
  }
  for (const auto& hostBinding : hostBindings) {
    frame->frame.commands.push_back("hostBind:" + hostBinding);
  }
  return frameValue;
}

value gpu_end_frame(const value& frameValue) {
  const auto frame = require_gpu_value(frameValue, "frame");
  require_gpu_frame_open(frame, "endFrame");
  if (frame->capabilities.available && frame->capabilities.supports_clear) {
    gpu_backend_clear_frame(frame);
  }
  frame->frame.commands.push_back("endFrame");
  frame->frame.open = false;
  frame->frame.ended = true;
  return value(std::monostate{});
}`;
}
