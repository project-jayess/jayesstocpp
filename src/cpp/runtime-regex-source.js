export function getRegexRuntimeHeaderFragment() {
  return `value regex_create(const value& pattern);
bool is_regex_value(const value& input);
value regex_test(const value& regexValue, const value& text);
value regex_exec(const value& regexValue, const value& text);`;
}

export function getRegexRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessRegexTagKey = "__jayess_regex_tag";
constexpr const char* kJayessRegexPatternKey = "__jayess_regex_pattern";

object_ptr require_regex_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected Jayess regex value");
  }

  const auto& object = std::get<object_ptr>(input);
  const auto tag = object->private_fields.find(kJayessRegexTagKey);
  if (tag == object->private_fields.end() || !std::holds_alternative<bool>(tag->second) || !std::get<bool>(tag->second)) {
    throw std::runtime_error("Expected Jayess regex value");
  }

  return object;
}

std::string require_regex_pattern_text(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex creation expects a string pattern");
  }
  return std::get<std::string>(input);
}

std::string require_regex_text_argument(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex operations expect a string text input");
  }
  return std::get<std::string>(input);
}

std::regex require_compiled_regex(const value& input) {
  const auto& object = require_regex_object(input);
  const auto pattern = object->private_fields.find(kJayessRegexPatternKey);
  if (pattern == object->private_fields.end() || !std::holds_alternative<std::string>(pattern->second)) {
    throw std::runtime_error("Jayess regex is missing pattern storage");
  }

  try {
    return std::regex(std::get<std::string>(pattern->second));
  } catch (const std::regex_error&) {
    throw std::runtime_error("Invalid Jayess regex pattern");
  }
}
} // namespace

value regex_create(const value& pattern) {
  auto object = std::make_shared<object_value>();
  object->private_fields.insert_or_assign(kJayessRegexTagKey, true);
  object->private_fields.insert_or_assign(kJayessRegexPatternKey, require_regex_pattern_text(pattern));
  return object;
}

bool is_regex_value(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    return false;
  }

  const auto& object = std::get<object_ptr>(input);
  const auto iterator = object->private_fields.find(kJayessRegexTagKey);
  return iterator != object->private_fields.end()
    && std::holds_alternative<bool>(iterator->second)
    && std::get<bool>(iterator->second);
}

value regex_test(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  return std::regex_search(input, compiled);
}

value regex_exec(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  std::smatch match;
  if (!std::regex_search(input, match, compiled)) {
    return value(std::monostate{});
  }

  std::vector<value> items;
  items.reserve(match.size());
  for (const auto& entry : match) {
    items.push_back(entry.str());
  }
  return make_array(std::move(items));
}`;
}
