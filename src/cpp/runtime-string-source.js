export function getStringRuntimeHeaderFragment() {
  return `value string_trim(const value& input);
value string_slice(const value& input, const std::vector<value>& args);
value string_substring(const value& input, const std::vector<value>& args);
value string_starts_with(const value& input, const std::vector<value>& args);
value string_includes(const value& input, const std::vector<value>& args);
value string_index_of(const value& input, const std::vector<value>& args);
value string_ends_with(const value& input, const std::vector<value>& args);
value string_split(const value& input, const value& separator);`;
}

export function getStringRuntimeCppFragment() {
  return `namespace {
std::string require_string_value(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

double require_string_number_argument(const std::vector<value>& args, std::size_t index, const std::string& message) {
  if (index >= args.size() || !std::holds_alternative<double>(args[index])) {
    throw std::runtime_error(message);
  }
  return std::get<double>(args[index]);
}

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

value string_trim(const value& input) {
  const auto text = require_string_value(input, "Jayess string trim expects a string input");
  auto start = text.begin();
  while (start != text.end() && std::isspace(static_cast<unsigned char>(*start))) {
    ++start;
  }

  auto end = text.end();
  while (end != start && std::isspace(static_cast<unsigned char>(*(end - 1)))) {
    --end;
  }

  return std::string(start, end);
}

value string_slice(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported slice receiver");
  const auto start = clamp_string_index(require_string_number_argument(args, 0, "Jayess string slice expects a numeric start index"), text.size());
  const auto end = args.size() > 1
    ? clamp_string_index(require_string_number_argument(args, 1, "Jayess string slice expects a numeric end index"), text.size())
    : text.size();

  if (end <= start) {
    return std::string("");
  }

  return text.substr(start, end - start);
}

value string_substring(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported substring receiver");
  auto start = clamp_string_index(require_string_number_argument(args, 0, "Jayess string substring expects a numeric start index"), text.size());
  auto end = args.size() > 1
    ? clamp_string_index(require_string_number_argument(args, 1, "Jayess string substring expects a numeric end index"), text.size())
    : text.size();

  if (end < start) {
    std::swap(start, end);
  }

  return text.substr(start, end - start);
}

value string_starts_with(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported startsWith receiver");
  const auto prefix = stringify_value(args[0]);
  if (prefix.size() > text.size()) {
    return false;
  }
  return text.compare(0, prefix.size(), prefix) == 0;
}

value string_includes(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported includes receiver");
  return text.find(stringify_value(args[0])) != std::string::npos;
}

value string_index_of(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported indexOf receiver");
  const auto found = text.find(stringify_value(args[0]));
  if (found == std::string::npos) {
    return static_cast<double>(-1);
  }
  return static_cast<double>(found);
}

value string_ends_with(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Unsupported endsWith receiver");
  const auto suffix = stringify_value(args[0]);
  if (suffix.size() > text.size()) {
    return false;
  }
  return text.compare(text.size() - suffix.size(), suffix.size(), suffix) == 0;
}

value string_split(const value& input, const value& separator) {
  const auto text = require_string_value(input, "Jayess string split expects a string input");
  const auto delimiter = require_string_value(separator, "Jayess string split expects a string separator");
  std::vector<value> items;

  if (delimiter.empty()) {
    items.reserve(text.size());
    for (const char character : text) {
      items.push_back(std::string(1, character));
    }
    return make_array(std::move(items));
  }

  std::size_t start = 0;
  while (true) {
    const auto found = text.find(delimiter, start);
    if (found == std::string::npos) {
      items.push_back(text.substr(start));
      break;
    }
    items.push_back(text.substr(start, found - start));
    start = found + delimiter.size();
  }

  return make_array(std::move(items));
}`;
}
