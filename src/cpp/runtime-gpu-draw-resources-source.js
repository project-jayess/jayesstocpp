export function getGpuDrawResourcesCppFragment() {
  return `const value& require_gpu_descriptor_field(const object_ptr& object, const std::string& key, const std::string& message) {
  const auto found = object->fields.find(key);
  if (found == object->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    throw std::runtime_error(message);
  }
  return found->second;
}

int gpu_descriptor_slot(const object_ptr& descriptor, const std::string& key, int fallback, const std::string& message) {
  const auto found = descriptor->fields.find(key);
  if (found == descriptor->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<double>(found->second)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(found->second);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0 || numeric > static_cast<double>((std::numeric_limits<int>::max)())) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

void require_gpu_resource_backend_match(const gpu_ptr& frame, const gpu_ptr& resource, const std::string& resourceName) {
  if (frame->backend != resource->backend) {
    throw std::runtime_error("Jayess GPU draw requires " + resourceName + " backend to match the active frame backend");
  }
}

void gpu_validate_vertex_buffer_binding(const gpu_ptr& frame, const value& descriptorValue, int fallbackSlot, std::vector<std::string>& bindings) {
  if (!std::holds_alternative<object_ptr>(descriptorValue)) {
    throw std::runtime_error("Jayess GPU draw vertex buffer binding must be an object");
  }
  const auto descriptor = std::get<object_ptr>(descriptorValue);
  const auto buffer = require_gpu_value(
    require_gpu_descriptor_field(descriptor, "buffer", "Jayess GPU draw vertex buffer binding requires buffer"),
    "buffer"
  );
  require_gpu_resource_backend_match(frame, buffer, "buffer");
  if (buffer->buffer.usage != "vertex") {
    throw std::runtime_error("Jayess GPU draw vertex buffer binding requires a vertex buffer");
  }
  const auto slot = gpu_descriptor_slot(descriptor, "slot", fallbackSlot, "Jayess GPU draw vertex buffer slot must be a non-negative integer");
  bindings.push_back("vertexBuffer:" + std::to_string(slot) + ":" + std::to_string(buffer->buffer.size));
}

void gpu_validate_texture_binding(const gpu_ptr& frame, const value& descriptorValue, int fallbackSlot, std::vector<std::string>& bindings) {
  if (!std::holds_alternative<object_ptr>(descriptorValue)) {
    throw std::runtime_error("Jayess GPU draw texture binding must be an object");
  }
  const auto descriptor = std::get<object_ptr>(descriptorValue);
  const auto texture = require_gpu_value(
    require_gpu_descriptor_field(descriptor, "texture", "Jayess GPU draw texture binding requires texture"),
    "texture"
  );
  require_gpu_resource_backend_match(frame, texture, "texture");
  if (!texture->texture.initialized) {
    throw std::runtime_error("Jayess GPU draw texture binding requires an initialized texture");
  }
  const auto slot = gpu_descriptor_slot(descriptor, "slot", fallbackSlot, "Jayess GPU draw texture slot must be a non-negative integer");
  bindings.push_back("texture:" + std::to_string(slot) + ":" + std::to_string(texture->texture.width) + "x" + std::to_string(texture->texture.height));
}

void gpu_validate_binding_array(const gpu_ptr& frame, const value& arrayValue, const std::string& key, std::vector<std::string>& bindings) {
  if (!std::holds_alternative<array_ptr>(arrayValue)) {
    throw std::runtime_error("Jayess GPU draw " + key + " must be an array");
  }
  const auto items = std::get<array_ptr>(arrayValue);
  for (std::size_t index = 0; index < items->items.size(); index = index + 1) {
    if (key == "vertexBuffers") {
      gpu_validate_vertex_buffer_binding(frame, items->items[index], static_cast<int>(index), bindings);
    } else if (key == "textures") {
      gpu_validate_texture_binding(frame, items->items[index], static_cast<int>(index), bindings);
    }
  }
}

std::vector<std::string> gpu_validate_draw_resources(const gpu_ptr& frame, const value& resourcesValue) {
  std::vector<std::string> bindings;
  if (std::holds_alternative<std::monostate>(resourcesValue)) {
    return bindings;
  }
  if (std::holds_alternative<array_ptr>(resourcesValue)) {
    gpu_validate_binding_array(frame, resourcesValue, "vertexBuffers", bindings);
    return bindings;
  }
  if (!std::holds_alternative<object_ptr>(resourcesValue)) {
    throw std::runtime_error("Jayess GPU draw expects resources object, array, or null");
  }
  const auto resources = std::get<object_ptr>(resourcesValue);
  const auto vertexBuffers = resources->fields.find("vertexBuffers");
  if (vertexBuffers != resources->fields.end() && !std::holds_alternative<std::monostate>(vertexBuffers->second)) {
    gpu_validate_binding_array(frame, vertexBuffers->second, "vertexBuffers", bindings);
  }
  const auto textures = resources->fields.find("textures");
  if (textures != resources->fields.end() && !std::holds_alternative<std::monostate>(textures->second)) {
    gpu_validate_binding_array(frame, textures->second, "textures", bindings);
  }
  const auto legacyBuffer = resources->fields.find("buffer");
  if (legacyBuffer != resources->fields.end() && !std::holds_alternative<std::monostate>(legacyBuffer->second)) {
    gpu_validate_vertex_buffer_binding(frame, make_object({{"buffer", legacyBuffer->second}}), static_cast<int>(bindings.size()), bindings);
  }
  const auto legacyTexture = resources->fields.find("texture");
  if (legacyTexture != resources->fields.end() && !std::holds_alternative<std::monostate>(legacyTexture->second)) {
    gpu_validate_texture_binding(frame, make_object({{"texture", legacyTexture->second}}), static_cast<int>(bindings.size()), bindings);
  }
  return bindings;
}`;
}
