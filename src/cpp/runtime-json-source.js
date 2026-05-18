export function getJsonRuntimeHeaderFragment() {
  return `value json_parse_text(const std::string& text);
value json_stringify_value(const value& input);
value json_stringify_pretty_value(const value& input, int indentWidth);
value json_validate_text(const std::string& text);
bool is_json_text(const std::string& text);`;
}

export function getJsonRuntimeCppFragment() {
  return `namespace {
struct json_error : std::runtime_error {
  std::size_t line;
  std::size_t column;

  json_error(const std::string& message, std::size_t line, std::size_t column)
    : std::runtime_error(message),
      line(line),
      column(column) {
  }
};

struct json_reader {
  const std::string& text;
  std::size_t index = 0;

  [[noreturn]] void fail(const std::string& message) const {
    std::size_t line = 1;
    std::size_t column = 1;
    for (std::size_t current = 0; current < index && current < text.size(); current += 1) {
      if (text[current] == '\\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
    throw json_error(message, line, column);
  }

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
      fail("Unexpected end of JSON input");
    }
    return text[index];
  }

  void expect(char expected) {
    if (!consume(expected)) {
      fail("Malformed JSON input");
    }
  }

  void expect_keyword(const char* keyword) {
    skip_whitespace();
    for (std::size_t offset = 0; keyword[offset] != '\\0'; offset += 1) {
      if (index + offset >= text.size() || text[index + offset] != keyword[offset]) {
        fail("Malformed JSON input");
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
        fail("Malformed JSON string escape");
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
          fail("Unsupported JSON string escape");
      }
    }

    fail("Unterminated JSON string");
  }

  value parse_number() {
    skip_whitespace();
    const auto start = index;
    if (index < text.size() && text[index] == '-') {
      index += 1;
    }
    if (index >= text.size() || !std::isdigit(static_cast<unsigned char>(text[index]))) {
      fail("Malformed JSON number");
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
        fail("Malformed JSON number");
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
        fail("Malformed JSON number");
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
        fail("JSON object keys must be strings");
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

std::string json_indent_prefix(int level, int indentWidth) {
  return std::string(static_cast<std::size_t>(level * indentWidth), ' ');
}

std::string json_stringify_impl(const value& input, int indentWidth, int level) {
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
    if (items.empty()) {
      return "[]";
    }

    std::ostringstream stream;
    const bool pretty = indentWidth >= 0;
    const auto childLevel = level + 1;
    stream << "[";
    if (pretty) {
      stream << "\\n";
    }
    for (std::size_t index = 0; index < items.size(); index += 1) {
      if (index > 0) {
        stream << ",";
        if (pretty) {
          stream << "\\n";
        }
      }
      if (pretty) {
        stream << json_indent_prefix(childLevel, indentWidth);
      }
      stream << json_stringify_impl(items[index], indentWidth, childLevel);
    }
    if (pretty) {
      stream << "\\n" << json_indent_prefix(level, indentWidth);
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

    if (keys.empty()) {
      return "{}";
    }

    std::ostringstream stream;
    const bool pretty = indentWidth >= 0;
    const auto childLevel = level + 1;
    stream << "{";
    if (pretty) {
      stream << "\\n";
    }
    bool first = true;
    for (const auto& key : keys) {
      if (!first) {
        stream << ",";
        if (pretty) {
          stream << "\\n";
        }
      }
      first = false;
      if (pretty) {
        stream << json_indent_prefix(childLevel, indentWidth);
      }
      stream << "\\"" << json_escape_string(key) << "\\":";
      if (pretty) {
        stream << " ";
      }
      stream << json_stringify_impl(std::get<object_ptr>(input)->fields.at(key), indentWidth, childLevel);
    }
    if (pretty) {
      stream << "\\n" << json_indent_prefix(level, indentWidth);
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
    reader.fail("Unexpected trailing JSON input");
  }
  return parsed;
}

value json_stringify_value(const value& input) {
  return json_stringify_impl(input, -1, 0);
}

value json_stringify_pretty_value(const value& input, int indentWidth) {
  if (indentWidth < 0) {
    throw std::runtime_error("Jayess JSON pretty indent must be non-negative");
  }
  return json_stringify_impl(input, indentWidth, 0);
}

value json_validate_text(const std::string& text) {
  try {
    static_cast<void>(json_parse_text(text));
    return value(std::monostate{});
  } catch (const json_error& error) {
    return make_object({
      {"message", std::string(error.what())},
      {"line", static_cast<double>(error.line)},
      {"column", static_cast<double>(error.column)}
    });
  } catch (const std::exception& error) {
    return make_object({
      {"message", std::string(error.what())},
      {"line", value(std::monostate{})},
      {"column", value(std::monostate{})}
    });
  }
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
