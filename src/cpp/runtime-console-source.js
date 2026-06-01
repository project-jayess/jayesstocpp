export function getConsoleRuntimeHeaderFragment() {
  return `value console_log_value(const value& input);
value console_error_value(const value& input);
value console_write_text(const std::string& text);
value console_write_line_text(const std::string& text);
value console_read_line_text();
value console_read_stdin_text();
value console_prompt_text(const std::string& text);`;
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
}

value console_read_line_text() {
  std::string line;
  if (!std::getline(std::cin, line)) {
    return value(std::monostate{});
  }
  return value(line);
}

value console_read_stdin_text() {
  std::ostringstream output;
  output << std::cin.rdbuf();
  return value(output.str());
}

value console_prompt_text(const std::string& text) {
  std::cout << text;
  std::cout.flush();
  return console_read_line_text();
}`;
}
