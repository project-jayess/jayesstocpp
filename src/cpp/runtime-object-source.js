export function getObjectRuntimeHeaderFragment() {
  return `value object_has(const value& input, const value& key);
value object_keys(const value& input);
value object_values(const value& input);
value object_entries(const value& input);
value object_from_entries(const value& entries);
value object_assign(const value& target, const value& source);`;
}

export function getObjectRuntimeCppFragment() {
  return `namespace {
std::unordered_map<std::string, value>& require_mutable_object_like_fields(value& input) {
  if (std::holds_alternative<object_ptr>(input)) {
    return std::get<object_ptr>(input)->fields;
  }
  if (std::holds_alternative<callable_ptr>(input)) {
    return std::get<callable_ptr>(input)->fields;
  }
  throw std::runtime_error("Expected a Jayess object-like value");
}

const std::unordered_map<std::string, value>& require_object_like_fields(const value& input) {
  if (std::holds_alternative<object_ptr>(input)) {
    return std::get<object_ptr>(input)->fields;
  }
  if (std::holds_alternative<callable_ptr>(input)) {
    return std::get<callable_ptr>(input)->fields;
  }
  throw std::runtime_error("Expected a Jayess object-like value");
}

std::vector<std::string> sorted_object_like_keys(const value& input) {
  const auto& fields = require_object_like_fields(input);
  std::vector<std::string> keys;
  keys.reserve(fields.size());
  for (const auto& [key, _stored] : fields) {
    keys.push_back(key);
  }
  std::sort(keys.begin(), keys.end());
  return keys;
}

std::string require_object_key_text(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess object helper expects a string key");
  }
  return std::get<std::string>(input);
}

array_ptr require_object_entry_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess object entries must be arrays");
  }
  const auto& entry = std::get<array_ptr>(input);
  if (entry->items.size() < 2) {
    throw std::runtime_error("Jayess object entries must contain key and value");
  }
  return entry;
}
} // namespace

value object_has(const value& input, const value& key) {
  const auto& fields = require_object_like_fields(input);
  return fields.find(require_object_key_text(key)) != fields.end();
}

value object_keys(const value& input) {
  auto keys = sorted_object_like_keys(input);
  std::vector<value> items;
  items.reserve(keys.size());
  for (const auto& key : keys) {
    items.push_back(key);
  }
  return make_array(std::move(items));
}

value object_values(const value& input) {
  const auto& fields = require_object_like_fields(input);
  auto keys = sorted_object_like_keys(input);
  std::vector<value> items;
  items.reserve(keys.size());
  for (const auto& key : keys) {
    items.push_back(fields.at(key));
  }
  return make_array(std::move(items));
}

value object_entries(const value& input) {
  const auto& fields = require_object_like_fields(input);
  auto keys = sorted_object_like_keys(input);
  std::vector<value> items;
  items.reserve(keys.size());
  for (const auto& key : keys) {
    items.push_back(make_array({value(key), fields.at(key)}));
  }
  return make_array(std::move(items));
}

value object_from_entries(const value& entries) {
  if (!std::holds_alternative<array_ptr>(entries)) {
    throw std::runtime_error("Jayess object fromEntries expects an array of entries");
  }

  std::vector<std::pair<std::string, value>> fields;
  const auto& entryArray = std::get<array_ptr>(entries);
  fields.reserve(entryArray->items.size());
  for (const auto& rawEntry : entryArray->items) {
    const auto entry = require_object_entry_array(rawEntry);
    fields.push_back({require_object_key_text(entry->items[0]), entry->items[1]});
  }
  return make_object(std::move(fields));
}

value object_assign(const value& target, const value& source) {
  value mutableTarget = target;
  auto& targetFields = require_mutable_object_like_fields(mutableTarget);
  const auto& sourceFields = require_object_like_fields(source);
  for (const auto& [key, stored] : sourceFields) {
    targetFields.insert_or_assign(key, stored);
  }
  return mutableTarget;
}`;
}
