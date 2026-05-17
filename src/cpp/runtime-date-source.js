export function getDateRuntimeHeaderFragment() {
  return `value make_date_now();
value make_date_from_unix_millis(double millis);
bool is_date_value(const value& input);
value date_to_unix_millis(const value& input);`;
}

export function getDateRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessDateTagKey = "__jayess_date_tag";
constexpr const char* kJayessDateMillisKey = "__jayess_date_millis";

object_ptr require_date_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected Jayess date value");
  }

  const auto& object = std::get<object_ptr>(input);
  const auto tag = object->private_fields.find(kJayessDateTagKey);
  if (tag == object->private_fields.end() || !std::holds_alternative<bool>(tag->second) || !std::get<bool>(tag->second)) {
    throw std::runtime_error("Expected Jayess date value");
  }

  return object;
}
} // namespace

value make_date_now() {
  const auto now = std::chrono::system_clock::now();
  const auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
  return make_date_from_unix_millis(static_cast<double>(millis));
}

value make_date_from_unix_millis(double millis) {
  auto object = std::make_shared<object_value>();
  object->private_fields.insert_or_assign(kJayessDateTagKey, true);
  object->private_fields.insert_or_assign(kJayessDateMillisKey, millis);
  return object;
}

bool is_date_value(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    return false;
  }

  const auto& object = std::get<object_ptr>(input);
  const auto iterator = object->private_fields.find(kJayessDateTagKey);
  return iterator != object->private_fields.end()
    && std::holds_alternative<bool>(iterator->second)
    && std::get<bool>(iterator->second);
}

value date_to_unix_millis(const value& input) {
  const auto& object = require_date_object(input);
  const auto iterator = object->private_fields.find(kJayessDateMillisKey);
  if (iterator == object->private_fields.end() || !std::holds_alternative<double>(iterator->second)) {
    throw std::runtime_error("Jayess date is missing timestamp storage");
  }

  return iterator->second;
}`;
}
