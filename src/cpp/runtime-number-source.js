export function getNumberRuntimeHeaderFragment() {
  return `value number_parse_int(const value& input);
value number_parse_float(const value& input);`;
}

export function getNumberRuntimeCppFragment() {
  return `namespace {
std::string trim_number_input(const std::string& input) {
  std::size_t start = 0;
  while (start < input.size() && std::isspace(static_cast<unsigned char>(input[start]))) {
    start += 1;
  }

  std::size_t end = input.size();
  while (end > start && std::isspace(static_cast<unsigned char>(input[end - 1]))) {
    end -= 1;
  }

  return input.substr(start, end - start);
}

const std::string& require_number_parse_text(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess number parsing expects a string input");
  }
  return std::get<std::string>(input);
}
} // namespace

value number_parse_int(const value& input) {
  const auto trimmed = trim_number_input(require_number_parse_text(input));
  if (trimmed.empty()) {
    return value(std::monostate{});
  }

  std::size_t consumed = 0;
  try {
    const auto parsed = std::stoll(trimmed, &consumed, 10);
    if (consumed != trimmed.size()) {
      return value(std::monostate{});
    }
    return static_cast<double>(parsed);
  } catch (const std::exception&) {
    return value(std::monostate{});
  }
}

value number_parse_float(const value& input) {
  const auto trimmed = trim_number_input(require_number_parse_text(input));
  if (trimmed.empty()) {
    return value(std::monostate{});
  }

  std::size_t consumed = 0;
  try {
    const auto parsed = std::stod(trimmed, &consumed);
    if (consumed != trimmed.size()) {
      return value(std::monostate{});
    }
    return parsed;
  } catch (const std::exception&) {
    return value(std::monostate{});
  }
}`;
}
