export function getObjectRuntimeHeaderFragment() {
  return `value object_keys(const value& input);
value object_values(const value& input);
value object_entries(const value& input);`;
}

export function getObjectRuntimeCppFragment() {
  return `namespace {
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
} // namespace

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
}`;
}
