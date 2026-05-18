export function getStringRuntimeHeaderFragment() {
  return `value string_slice(const value& input, const std::vector<value>& args);
value string_substring(const value& input, const std::vector<value>& args);
value string_starts_with(const value& input, const std::vector<value>& args);
value string_includes(const value& input, const std::vector<value>& args);
value string_index_of(const value& input, const std::vector<value>& args);
value string_ends_with(const value& input, const std::vector<value>& args);`;
}

export function getStringRuntimeCppFragment() {
  return `namespace {
std::size_t clamp_string_index(double raw, std::size_t size) {
  if (raw <= 0.0) {
    return 0;
  }
  const auto index = static_cast<std::size_t>(raw);
  if (index > size) {
    return size;
  }
  return index;
}
} // namespace

value string_slice(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported slice receiver");
  }

  const auto& text = std::get<std::string>(input);
  const auto start = clamp_string_index(std::get<double>(args[0]), text.size());
  const auto end = args.size() > 1
    ? clamp_string_index(std::get<double>(args[1]), text.size())
    : text.size();

  if (end <= start) {
    return std::string("");
  }

  return text.substr(start, end - start);
}

value string_substring(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported substring receiver");
  }

  const auto& text = std::get<std::string>(input);
  auto start = clamp_string_index(std::get<double>(args[0]), text.size());
  auto end = args.size() > 1
    ? clamp_string_index(std::get<double>(args[1]), text.size())
    : text.size();

  if (end < start) {
    std::swap(start, end);
  }

  return text.substr(start, end - start);
}

value string_starts_with(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported startsWith receiver");
  }

  const auto& text = std::get<std::string>(input);
  const auto prefix = stringify_value(args[0]);
  if (prefix.size() > text.size()) {
    return false;
  }
  return text.compare(0, prefix.size(), prefix) == 0;
}

value string_includes(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported includes receiver");
  }

  const auto& text = std::get<std::string>(input);
  return text.find(stringify_value(args[0])) != std::string::npos;
}

value string_index_of(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported indexOf receiver");
  }

  const auto& text = std::get<std::string>(input);
  const auto found = text.find(stringify_value(args[0]));
  if (found == std::string::npos) {
    return static_cast<double>(-1);
  }
  return static_cast<double>(found);
}

value string_ends_with(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Unsupported endsWith receiver");
  }

  const auto& text = std::get<std::string>(input);
  const auto suffix = stringify_value(args[0]);
  if (suffix.size() > text.size()) {
    return false;
  }
  return text.compare(text.size() - suffix.size(), suffix.size(), suffix) == 0;
}`;
}
