export function getConsoleRuntimeHeaderFragment() {
  return `value console_log_value(const value& input);
value console_error_value(const value& input);
value console_write_text(const std::string& text);
value console_write_line_text(const std::string& text);`;
}

export function getConsoleRuntimeCppFragment() {
  return `value console_log_value(const value& input) {
  std::cout << stringify_value(input) << std::endl;
  return value(std::monostate{});
}

value console_error_value(const value& input) {
  std::cerr << stringify_value(input) << std::endl;
  return value(std::monostate{});
}

value console_write_text(const std::string& text) {
  std::cout << text;
  return value(std::monostate{});
}

value console_write_line_text(const std::string& text) {
  std::cout << text << std::endl;
  return value(std::monostate{});
}`;
}
