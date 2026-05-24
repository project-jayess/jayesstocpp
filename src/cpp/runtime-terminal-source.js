export function getTerminalRuntimeHeaderFragment() {
  return `value terminal_ansi(const value& style);
value terminal_strip_ansi(const value& text);
value terminal_cursor_to(const value& row, const value& column);
value terminal_clear_screen();
value terminal_clear_line();
value terminal_size();`;
}

export function getTerminalRuntimeCppFragment() {
  return `namespace {
std::string require_terminal_string(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

int require_terminal_positive_integer(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric <= 0.0 || numeric > static_cast<double>(std::numeric_limits<int>::max())) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

value terminal_env_integer(const char* key) {
  const auto* raw = std::getenv(key);
  if (raw == nullptr || raw[0] == '\\0') {
    return value(std::monostate{});
  }
  try {
    std::size_t consumed = 0;
    const auto numeric = std::stoi(std::string(raw), &consumed);
    if (consumed != std::string(raw).size() || numeric <= 0) {
      return value(std::monostate{});
    }
    return static_cast<double>(numeric);
  } catch (const std::exception&) {
    return value(std::monostate{});
  }
}

std::string terminal_style_code(const std::string& style) {
  if (style == "reset") return "0";
  if (style == "bold") return "1";
  if (style == "dim") return "2";
  if (style == "italic") return "3";
  if (style == "underline") return "4";
  if (style == "black") return "30";
  if (style == "red") return "31";
  if (style == "green") return "32";
  if (style == "yellow") return "33";
  if (style == "blue") return "34";
  if (style == "magenta") return "35";
  if (style == "cyan") return "36";
  if (style == "white") return "37";
  if (style == "bgBlack") return "40";
  if (style == "bgRed") return "41";
  if (style == "bgGreen") return "42";
  if (style == "bgYellow") return "43";
  if (style == "bgBlue") return "44";
  if (style == "bgMagenta") return "45";
  if (style == "bgCyan") return "46";
  if (style == "bgWhite") return "47";
  throw std::runtime_error("Jayess terminal ansi style is not supported");
}
} // namespace

value terminal_ansi(const value& styleValue) {
  const auto style = require_terminal_string(styleValue, "Jayess terminal ansi style must be a string");
  return std::string("\\x1b[") + terminal_style_code(style) + "m";
}

value terminal_strip_ansi(const value& textValue) {
  const auto text = require_terminal_string(textValue, "Jayess terminal stripAnsi text must be a string");
  std::string output;
  for (std::size_t index = 0; index < text.size();) {
    if (text[index] == '\\x1b' && index + 1 < text.size() && text[index + 1] == '[') {
      index += 2;
      while (index < text.size()) {
        const auto current = static_cast<unsigned char>(text[index]);
        index += 1;
        if (current >= 0x40U && current <= 0x7eU) {
          break;
        }
      }
      continue;
    }
    output.push_back(text[index]);
    index += 1;
  }
  return output;
}

value terminal_cursor_to(const value& rowValue, const value& columnValue) {
  const auto row = require_terminal_positive_integer(rowValue, "Jayess terminal cursor row must be a positive integer");
  const auto column = require_terminal_positive_integer(columnValue, "Jayess terminal cursor column must be a positive integer");
  return std::string("\\x1b[") + std::to_string(row) + ";" + std::to_string(column) + "H";
}

value terminal_clear_screen() {
  return std::string("\\x1b[2J");
}

value terminal_clear_line() {
  return std::string("\\x1b[2K");
}

value terminal_size() {
  auto columns = terminal_env_integer("COLUMNS");
  auto rows = terminal_env_integer("LINES");
  if (is_null(columns) || is_null(rows)) {
    return value(std::monostate{});
  }
  return make_object({
    {"columns", columns},
    {"rows", rows}
  });
}`;
}
