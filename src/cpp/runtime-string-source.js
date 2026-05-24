export function getStringRuntimeHeaderFragment() {
  return `value string_trim(const value& input);
value string_slice(const value& input, const std::vector<value>& args);
value string_substring(const value& input, const std::vector<value>& args);
value string_starts_with(const value& input, const std::vector<value>& args);
value string_includes(const value& input, const std::vector<value>& args);
value string_index_of(const value& input, const std::vector<value>& args);
value string_ends_with(const value& input, const std::vector<value>& args);
value string_split(const value& input, const value& separator);
value string_replace_first(const value& input, const value& search, const value& replacement);
value string_replace_all(const value& input, const value& search, const value& replacement);
value string_pad_start(const value& input, const std::vector<value>& args);
value string_pad_end(const value& input, const std::vector<value>& args);
value string_repeat(const value& input, const value& count);
value string_to_lower(const value& input);
value string_to_upper(const value& input);`;
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

std::size_t require_string_size_argument(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto raw = std::get<double>(input);
  if (raw <= 0.0) {
    return 0;
  }
  return static_cast<std::size_t>(raw);
}

std::string repeat_fill_to_size(const std::string& fill, std::size_t size) {
  if (fill.empty() || size == 0) {
    return "";
  }
  std::string result;
  result.reserve(size);
  while (result.size() < size) {
    result += fill;
  }
  result.resize(size);
  return result;
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
  const auto text = require_string_value(input, "Jayess string slice requires a string receiver");
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
  const auto text = require_string_value(input, "Jayess string substring requires a string receiver");
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
  const auto text = require_string_value(input, "Jayess string startsWith requires a string receiver");
  const auto prefix = stringify_value(args[0]);
  if (prefix.size() > text.size()) {
    return false;
  }
  return text.compare(0, prefix.size(), prefix) == 0;
}

value string_includes(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Jayess string includes requires a string receiver");
  return text.find(stringify_value(args[0])) != std::string::npos;
}

value string_index_of(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Jayess string indexOf requires a string receiver");
  const auto found = text.find(stringify_value(args[0]));
  if (found == std::string::npos) {
    return static_cast<double>(-1);
  }
  return static_cast<double>(found);
}

value string_ends_with(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Jayess string endsWith requires a string receiver");
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
}

value string_replace_first(const value& input, const value& search, const value& replacement) {
  if (is_regex_value(search)) {
    return regex_replace_first(search, input, replacement);
  }
  auto text = require_string_value(input, "Jayess string replaceFirst expects a string input");
  const auto needle = require_string_value(search, "Jayess string replaceFirst expects a string search value");
  const auto assigned = require_string_value(replacement, "Jayess string replaceFirst expects a string replacement");
  if (needle.empty()) {
    return text;
  }
  const auto found = text.find(needle);
  if (found == std::string::npos) {
    return text;
  }
  text.replace(found, needle.size(), assigned);
  return text;
}

value string_replace_all(const value& input, const value& search, const value& replacement) {
  if (is_regex_value(search)) {
    return regex_replace_all(search, input, replacement);
  }
  auto text = require_string_value(input, "Jayess string replaceAll expects a string input");
  const auto needle = require_string_value(search, "Jayess string replaceAll expects a string search value");
  const auto assigned = require_string_value(replacement, "Jayess string replaceAll expects a string replacement");
  if (needle.empty()) {
    return text;
  }
  std::size_t start = 0;
  while (true) {
    const auto found = text.find(needle, start);
    if (found == std::string::npos) {
      break;
    }
    text.replace(found, needle.size(), assigned);
    start = found + assigned.size();
  }
  return text;
}

value string_pad_start(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Jayess string padStart expects a string input");
  const auto target = require_string_size_argument(args.at(0), "Jayess string padStart expects a numeric target length");
  const auto fill = args.size() > 1 ? require_string_value(args[1], "Jayess string padStart expects a string fill value") : std::string(" ");
  if (target <= text.size() || fill.empty()) {
    return text;
  }
  return repeat_fill_to_size(fill, target - text.size()) + text;
}

value string_pad_end(const value& input, const std::vector<value>& args) {
  const auto text = require_string_value(input, "Jayess string padEnd expects a string input");
  const auto target = require_string_size_argument(args.at(0), "Jayess string padEnd expects a numeric target length");
  const auto fill = args.size() > 1 ? require_string_value(args[1], "Jayess string padEnd expects a string fill value") : std::string(" ");
  if (target <= text.size() || fill.empty()) {
    return text;
  }
  return text + repeat_fill_to_size(fill, target - text.size());
}

value string_repeat(const value& input, const value& count) {
  const auto text = require_string_value(input, "Jayess string repeat expects a string input");
  const auto times = require_string_size_argument(count, "Jayess string repeat expects a numeric count");
  std::string result;
  result.reserve(text.size() * times);
  for (std::size_t index = 0; index < times; index += 1) {
    result += text;
  }
  return result;
}

value string_to_lower(const value& input) {
  auto text = require_string_value(input, "Jayess string toLower expects a string input");
  for (char& character : text) {
    character = static_cast<char>(std::tolower(static_cast<unsigned char>(character)));
  }
  return text;
}

value string_to_upper(const value& input) {
  auto text = require_string_value(input, "Jayess string toUpper expects a string input");
  for (char& character : text) {
    character = static_cast<char>(std::toupper(static_cast<unsigned char>(character)));
  }
  return text;
}`;
}
