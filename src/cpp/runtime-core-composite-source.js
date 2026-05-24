export function getCoreCompositeMutationRuntimeHeaderFragment() {
  return `value destructure_property(const value& input, const std::string& key);
value destructure_index(const value& input, const value& key);
value destructure_rest_array(const value& input, std::size_t startIndex);
value destructure_rest_object(const value& input, std::vector<std::string> excludedKeys);
value array_push(const value& input, std::vector<value> items);
void append_spread_values(std::vector<value>& args, const value& input);
void append_object_spread_fields(std::vector<std::pair<std::string, value>>& fields, const value& input);
value set_property(const value& input, const std::string& key, const value& assigned);
value set_index(const value& input, const value& key, const value& assigned);`;
}

export function getCoreCompositeMutationRuntimeCppFragment() {
  return `value destructure_property(const value& input, const std::string& key) {
  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    const auto iterator = callable->fields.find(key);
    if (iterator == callable->fields.end()) {
      return value(std::monostate{});
    }
    return iterator->second;
  }

  if (std::holds_alternative<object_ptr>(input)) {
    const auto& object = std::get<object_ptr>(input);
    const auto iterator = object->fields.find(key);
    if (iterator == object->fields.end()) {
      return value(std::monostate{});
    }
    return iterator->second;
  }

  throw_unsupported_destructuring_source("object", "an object or callable source");
}

value destructure_index(const value& input, const value& key) {
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& array = std::get<array_ptr>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= array->items.size()) {
      return value(std::monostate{});
    }
    return array->items[index];
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return destructure_property(input, property_key_string(key));
  }

  throw_unsupported_destructuring_source("indexed", "an array, object, or callable source");
}

value destructure_rest_array(const value& input, std::size_t startIndex) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw_unsupported_destructuring_source("array rest", "an array source");
  }

  const auto& array = std::get<array_ptr>(input);
  std::vector<value> items;
  if (startIndex < array->items.size()) {
    items.reserve(array->items.size() - startIndex);
    for (std::size_t index = startIndex; index < array->items.size(); index += 1) {
      items.push_back(array->items[index]);
    }
  }
  return make_array(std::move(items));
}

value destructure_rest_object(const value& input, std::vector<std::string> excludedKeys) {
  std::unordered_map<std::string, value> sourceFields;

  if (std::holds_alternative<object_ptr>(input)) {
    sourceFields = std::get<object_ptr>(input)->fields;
  } else if (std::holds_alternative<callable_ptr>(input)) {
    sourceFields = std::get<callable_ptr>(input)->fields;
  } else {
    throw_unsupported_destructuring_source("object rest", "an object or callable source");
  }

  auto object = std::make_shared<object_value>();
  for (const auto& key : excludedKeys) {
    sourceFields.erase(key);
  }
  object->fields = std::move(sourceFields);
  return object;
}

value set_property(const value& input, const std::string& key, const value& assigned) {
  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    callable->fields.insert_or_assign(key, assigned);
    return assigned;
  }
  const auto& object = std::get<object_ptr>(input);
  object->fields.insert_or_assign(key, assigned);
  return assigned;
}

value set_index(const value& input, const value& key, const value& assigned) {
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& array = std::get<array_ptr>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= array->items.size()) {
      throw std::runtime_error("Array index out of bounds");
    }
    array->items[index] = assigned;
    return assigned;
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return set_property(input, property_key_string(key), assigned);
  }

  throw_unsupported_receiver("indexed assignment", "set", "array, object, or callable");
}

value array_push(const value& input, std::vector<value> items) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw_unsupported_receiver("array", "push", "array");
  }

  const auto& array = std::get<array_ptr>(input);
  for (auto& item : items) {
    array->items.push_back(std::move(item));
  }

  return static_cast<double>(array->items.size());
}

void append_spread_values(std::vector<value>& args, const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw_unsupported_spread_source("argument", "an array source");
  }

  const auto& array = std::get<array_ptr>(input);
  args.insert(args.end(), array->items.begin(), array->items.end());
}

void append_object_spread_fields(std::vector<std::pair<std::string, value>>& fields, const value& input) {
  if (std::holds_alternative<object_ptr>(input)) {
    const auto& object = std::get<object_ptr>(input);
    for (const auto& [key, value] : object->fields) {
      fields.push_back({key, value});
    }
    return;
  }

  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    for (const auto& [key, value] : callable->fields) {
      fields.push_back({key, value});
    }
    return;
  }

  throw_unsupported_spread_source("object", "an object or callable source");
}`;
}
