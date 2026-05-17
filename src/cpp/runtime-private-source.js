export function getPrivateRuntimeHeaderFragment() {
  return `value get_private_field(const value& instance, const value& classValue, const std::string& key);
value set_private_field(const value& instance, const value& classValue, const std::string& key, const value& assigned);`;
}

export function getPrivateRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessPrivateFieldPrefix = "__jayess_private_";

callable_ptr require_private_class_value(const value& input) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error("Expected a Jayess class value for private field access");
  }
  return std::get<callable_ptr>(input);
}

object_ptr require_private_instance_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected a Jayess instance object for private field access");
  }
  return std::get<object_ptr>(input);
}

std::string private_field_storage_key(const value& classValue, const std::string& key) {
  std::ostringstream stream;
  stream << kJayessPrivateFieldPrefix << require_private_class_value(classValue).get() << "_" << key;
  return stream.str();
}
} // namespace

value get_private_field(const value& instance, const value& classValue, const std::string& key) {
  const auto& object = require_private_instance_object(instance);
  const auto storageKey = private_field_storage_key(classValue, key);
  const auto iterator = object->private_fields.find(storageKey);
  if (iterator == object->private_fields.end()) {
    throw std::runtime_error("Missing private field");
  }
  return iterator->second;
}

value set_private_field(const value& instance, const value& classValue, const std::string& key, const value& assigned) {
  const auto& object = require_private_instance_object(instance);
  const auto storageKey = private_field_storage_key(classValue, key);
  object->private_fields.insert_or_assign(storageKey, assigned);
  return assigned;
}`;
}
