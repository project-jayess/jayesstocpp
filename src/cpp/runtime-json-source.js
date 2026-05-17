export function getJsonRuntimeHeaderFragment() {
  return `value json_parse_text(const std::string& text);
value json_stringify_value(const value& input);
bool is_json_text(const std::string& text);`;
}

export function getJsonRuntimeCppFragment() {
  return `namespace {
struct json_reader {
  const std::string& text;
  std::size_t index = 0;

  void skip_whitespace() {
    while (index < text.size() && std::isspace(static_cast<unsigned char>(text[index]))) {
      index += 1;
    }
  }

  bool consume(char expected) {
    skip_whitespace();
    if (index < text.size() && text[index] == expected) {
      index += 1;
      return true;
    }
    return false;
  }

  char peek() {
    skip_whitespace();
    if (index >= text.size()) {
      throw std::runtime_error("Unexpected end of JSON input");
    }
    return text[index];
  }

  void expect(char expected) {
    if (!consume(expected)) {
      throw std::runtime_error("Malformed JSON input");
    }
  }

  void expect_keyword(const char* keyword) {
    skip_whitespace();
    for (std::size_t offset = 0; keyword[offset] != '\\0'; offset += 1) {
      if (index + offset >= text.size() || text[index + offset] != keyword[offset]) {
        throw std::runtime_error("Malformed JSON input");
      }
    }
    index += std::char_traits<char>::length(keyword);
  }

  std::string parse_string() {
    expect('"');
    std::string result;
    while (index < text.size()) {
      const char current = text[index++];
      if (current == '"') {
        return result;
      }
      if (current != '\\\\') {
        result.push_back(current);
        continue;
      }

      if (index >= text.size()) {
        throw std::runtime_error("Malformed JSON string escape");
      }

      const char escaped = text[index++];
      switch (escaped) {
        case '"':
        case '\\\\':
        case '/':
          result.push_back(escaped);
          break;
        case 'b':
          result.push_back('\\b');
          break;
        case 'f':
          result.push_back('\\f');
          break;
        case 'n':
          result.push_back('\\n');
          break;
        case 'r':
          result.push_back('\\r');
          break;
        case 't':
          result.push_back('\\t');
          break;
        default:
          throw std::runtime_error("Unsupported JSON string escape");
      }
    }

    throw std::runtime_error("Unterminated JSON string");
  }

  value parse_number() {
    skip_whitespace();
    const auto start = index;
    if (index < text.size() && text[index] == '-') {
      index += 1;
    }
    if (index >= text.size() || !std::isdigit(static_cast<unsigned char>(text[index]))) {
      throw std::runtime_error("Malformed JSON number");
    }
    if (text[index] == '0') {
      index += 1;
    } else {
      while (index < text.size() && std::isdigit(static_cast<unsigned char>(text[index]))) {
        index += 1;
      }
    }
    if (index < text.size() && text[index] == '.') {
      index += 1;
      if (index >= text.size() || !std::isdigit(static_cast<unsigned char>(text[index]))) {
        throw std::runtime_error("Malformed JSON number");
      }
      while (index < text.size() && std::isdigit(static_cast<unsigned char>(text[index]))) {
        index += 1;
      }
    }
    if (index < text.size() && (text[index] == 'e' || text[index] == 'E')) {
      index += 1;
      if (index < text.size() && (text[index] == '+' || text[index] == '-')) {
        index += 1;
      }
      if (index >= text.size() || !std::isdigit(static_cast<unsigned char>(text[index]))) {
        throw std::runtime_error("Malformed JSON number");
      }
      while (index < text.size() && std::isdigit(static_cast<unsigned char>(text[index]))) {
        index += 1;
      }
    }
    return std::stod(text.substr(start, index - start));
  }

  value parse_array() {
    expect('[');
    std::vector<value> items;
    skip_whitespace();
    if (consume(']')) {
      return make_array(std::move(items));
    }
    while (true) {
      items.push_back(parse_value());
      skip_whitespace();
      if (consume(']')) {
        return make_array(std::move(items));
      }
      expect(',');
    }
  }

  value parse_object() {
    expect('{');
    std::vector<std::pair<std::string, value>> fields;
    skip_whitespace();
    if (consume('}')) {
      return make_object(std::move(fields));
    }
    while (true) {
      skip_whitespace();
      if (peek() != '"') {
        throw std::runtime_error("JSON object keys must be strings");
      }
      const auto key = parse_string();
      expect(':');
      fields.push_back({key, parse_value()});
      skip_whitespace();
      if (consume('}')) {
        return make_object(std::move(fields));
      }
      expect(',');
    }
  }

  value parse_value() {
    skip_whitespace();
    switch (peek()) {
      case 'n':
        expect_keyword("null");
        return value(std::monostate{});
      case 't':
        expect_keyword("true");
        return true;
      case 'f':
        expect_keyword("false");
        return false;
      case '"':
        return parse_string();
      case '[':
        return parse_array();
      case '{':
        return parse_object();
      default:
        return parse_number();
    }
  }
};

std::string json_escape_string(const std::string& input) {
  std::ostringstream stream;
  for (const auto current : input) {
    switch (current) {
      case '"':
        stream << "\\\\\\"";
        break;
      case '\\\\':
        stream << "\\\\\\\\";
        break;
      case '\\b':
        stream << "\\\\b";
        break;
      case '\\f':
        stream << "\\\\f";
        break;
      case '\\n':
        stream << "\\\\n";
        break;
      case '\\r':
        stream << "\\\\r";
        break;
      case '\\t':
        stream << "\\\\t";
        break;
      default:
        stream << current;
        break;
    }
  }
  return stream.str();
}

std::string json_stringify_impl(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return "null";
  }
  if (std::holds_alternative<bool>(input)) {
    return std::get<bool>(input) ? "true" : "false";
  }
  if (std::holds_alternative<double>(input)) {
    const auto number = std::get<double>(input);
    if (!std::isfinite(number)) {
      throw std::runtime_error("Cannot JSON-stringify non-finite numbers");
    }
    std::ostringstream stream;
    stream << number;
    return stream.str();
  }
  if (std::holds_alternative<std::string>(input)) {
    return "\\"" + json_escape_string(std::get<std::string>(input)) + "\\"";
  }
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& items = std::get<array_ptr>(input)->items;
    std::ostringstream stream;
    stream << "[";
    for (std::size_t index = 0; index < items.size(); index += 1) {
      if (index > 0) {
        stream << ",";
      }
      stream << json_stringify_impl(items[index]);
    }
    stream << "]";
    return stream.str();
  }
  if (std::holds_alternative<object_ptr>(input)) {
    std::vector<std::string> keys;
    for (const auto& [key, _] : std::get<object_ptr>(input)->fields) {
      keys.push_back(key);
    }
    std::sort(keys.begin(), keys.end());

    std::ostringstream stream;
    stream << "{";
    bool first = true;
    for (const auto& key : keys) {
      if (!first) {
        stream << ",";
      }
      first = false;
      stream << "\\"" << json_escape_string(key) << "\\":" << json_stringify_impl(std::get<object_ptr>(input)->fields.at(key));
    }
    stream << "}";
    return stream.str();
  }

  throw std::runtime_error("Unsupported Jayess value for JSON stringify");
}
} // namespace

value json_parse_text(const std::string& text) {
  json_reader reader{text};
  auto parsed = reader.parse_value();
  reader.skip_whitespace();
  if (reader.index != text.size()) {
    throw std::runtime_error("Unexpected trailing JSON input");
  }
  return parsed;
}

value json_stringify_value(const value& input) {
  return json_stringify_impl(input);
}

bool is_json_text(const std::string& text) {
  try {
    static_cast<void>(json_parse_text(text));
    return true;
  } catch (...) {
    return false;
  }
}`;
}
