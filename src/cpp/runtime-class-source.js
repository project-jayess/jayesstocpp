export function getClassRuntimeHeaderFragment() {
  return `value define_class_method(const value& classValue, const std::string& key, const value& method);
value define_dynamic_class_method(const value& classValue, const value& key, const value& method);
value bind_method(const value& instance, const value& method);
value set_base_class(const value& classValue, const value& baseClass);
value get_base_class(const value& classValue);
value set_class_constructor(const value& classValue, const value& constructorValue);
value get_class_constructor(const value& classValue);
value call_class_constructor(const value& classValue, const value& instance, std::vector<value> args);
value set_instance_class(const value& instance, const value& classValue);
value get_instance_class(const value& instance);
value find_class_method(const value& classValue, const std::string& key);`;
}

export function getClassRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessBaseClassKey = "__jayess_base_class";
constexpr const char* kJayessConstructorKey = "__jayess_constructor";
constexpr const char* kJayessInstanceClassKey = "__jayess_class";

std::string class_method_key(const std::string& key) {
  return "__jayess_method_" + key;
}

std::string class_member_name(const value& key) {
  if (std::holds_alternative<std::monostate>(key)) {
    return "null";
  }
  if (std::holds_alternative<double>(key)) {
    std::ostringstream stream;
    stream << std::get<double>(key);
    return stream.str();
  }
  if (std::holds_alternative<bool>(key)) {
    return std::get<bool>(key) ? "true" : "false";
  }
  if (std::holds_alternative<std::string>(key)) {
    return std::get<std::string>(key);
  }
  throw std::runtime_error("Unsupported computed class member key");
}

callable_ptr require_class_value(const value& input) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error("Expected a Jayess class value");
  }
  return std::get<callable_ptr>(input);
}

object_ptr require_instance_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected a Jayess instance object");
  }
  return std::get<object_ptr>(input);
}
} // namespace

value define_class_method(const value& classValue, const std::string& key, const value& method) {
  const auto& callable = require_class_value(classValue);
  callable->fields.insert_or_assign(class_method_key(key), method);
  return method;
}

value define_dynamic_class_method(const value& classValue, const value& key, const value& method) {
  return define_class_method(classValue, class_member_name(key), method);
}

value bind_method(const value& instance, const value& method) {
  require_instance_object(instance);
  const auto& callable = require_class_value(method);
  return make_callable([instance, callable](const std::vector<value>& args) -> value {
    std::vector<value> boundArgs;
    boundArgs.reserve(args.size() + 1);
    boundArgs.push_back(instance);
    boundArgs.insert(boundArgs.end(), args.begin(), args.end());
    return callable->fn(boundArgs);
  });
}

value set_base_class(const value& classValue, const value& baseClass) {
  const auto& callable = require_class_value(classValue);
  if (!std::holds_alternative<std::monostate>(baseClass) && !std::holds_alternative<callable_ptr>(baseClass)) {
    throw std::runtime_error("Base class must be a Jayess class value or null");
  }
  callable->fields.insert_or_assign(kJayessBaseClassKey, baseClass);
  return baseClass;
}

value get_base_class(const value& classValue) {
  const auto& callable = require_class_value(classValue);
  const auto iterator = callable->fields.find(kJayessBaseClassKey);
  if (iterator == callable->fields.end()) {
    return value(std::monostate{});
  }
  return iterator->second;
}

value set_class_constructor(const value& classValue, const value& constructorValue) {
  const auto& callable = require_class_value(classValue);
  require_class_value(constructorValue);
  callable->fields.insert_or_assign(kJayessConstructorKey, constructorValue);
  return constructorValue;
}

value get_class_constructor(const value& classValue) {
  const auto& callable = require_class_value(classValue);
  const auto iterator = callable->fields.find(kJayessConstructorKey);
  if (iterator == callable->fields.end()) {
    throw std::runtime_error("Missing class constructor");
  }
  return iterator->second;
}

value call_class_constructor(const value& classValue, const value& instance, std::vector<value> args) {
  std::vector<value> constructorArgs;
  constructorArgs.reserve(args.size() + 1);
  constructorArgs.push_back(instance);
  constructorArgs.insert(constructorArgs.end(), args.begin(), args.end());
  return call_with_args(get_class_constructor(classValue), std::move(constructorArgs));
}

value set_instance_class(const value& instance, const value& classValue) {
  const auto& object = require_instance_object(instance);
  require_class_value(classValue);
  object->fields.insert_or_assign(kJayessInstanceClassKey, classValue);
  return classValue;
}

value get_instance_class(const value& instance) {
  const auto& object = require_instance_object(instance);
  const auto iterator = object->fields.find(kJayessInstanceClassKey);
  if (iterator == object->fields.end()) {
    return value(std::monostate{});
  }
  return iterator->second;
}

value find_class_method(const value& classValue, const std::string& key) {
  value current = classValue;
  while (!std::holds_alternative<std::monostate>(current)) {
    const auto& callable = require_class_value(current);
    const auto iterator = callable->fields.find(class_method_key(key));
    if (iterator != callable->fields.end()) {
      return iterator->second;
    }
    current = get_base_class(current);
  }
  throw std::runtime_error("Missing class method");
}`;
}
