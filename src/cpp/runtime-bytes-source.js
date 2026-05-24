export function getBytesRuntimeHeaderFragment() {
  return `value bytes_from_utf8(const value& text);
value bytes_from_array(const value& input);
value bytes_to_array(const value& input);
value bytes_to_utf8(const value& input);
value bytes_length(const value& input);
value bytes_get(const value& input, const value& index);
value bytes_set(const value& input, const value& index, const value& assigned);
value bytes_fill(const value& input, const value& assigned);
value bytes_slice(const value& input, const std::vector<value>& args);
value bytes_concat(const value& left, const value& right);
value bytes_equals(const value& left, const value& right);
value bytes_secure_equals(const value& left, const value& right);
value bytes_compare(const value& left, const value& right);
value bytes_starts_with(const value& input, const value& prefix);
value bytes_ends_with(const value& input, const value& suffix);
bool is_bytes_value(const value& input);`;
}

export function getBytesRuntimeCppFragment() {
  return `namespace {
bytes_ptr require_bytes_value(const value& input, const std::string& message) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bytes_ptr>(input);
}

std::string require_bytes_text_value(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

double require_bytes_number_argument(const std::vector<value>& args, std::size_t index, const std::string& message) {
  if (index >= args.size() || !std::holds_alternative<double>(args[index])) {
    throw std::runtime_error(message);
  }
  return std::get<double>(args[index]);
}

unsigned char require_byte_number(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0 || numeric > 255.0) {
    throw std::runtime_error(message);
  }
  return static_cast<unsigned char>(numeric);
}

std::size_t require_byte_index(const value& input, std::size_t size, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0) {
    throw std::runtime_error(message);
  }
  const auto index = static_cast<std::size_t>(numeric);
  if (index >= size) {
    throw std::runtime_error(message);
  }
  return index;
}

std::size_t clamp_bytes_index(double raw, std::size_t size) {
  if (raw <= 0.0) {
    return 0;
  }
  const auto index = static_cast<std::size_t>(raw);
  if (index > size) {
    return size;
  }
  return index;
}

value make_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}
} // namespace

value bytes_from_utf8(const value& text) {
  const auto input = require_bytes_text_value(text, "Jayess bytes fromUtf8 expects a string input");
  std::vector<unsigned char> items(input.begin(), input.end());
  return make_bytes(std::move(items));
}

value bytes_from_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess bytes fromArray expects an array input");
  }
  const auto array = std::get<array_ptr>(input);
  std::vector<unsigned char> items;
  items.reserve(array->items.size());
  for (const auto& item : array->items) {
    items.push_back(require_byte_number(item, "Jayess bytes fromArray expects byte numbers"));
  }
  return make_bytes(std::move(items));
}

value bytes_to_array(const value& input) {
  const auto bytes = require_bytes_value(input, "Jayess bytes toArray expects a bytes input");
  std::vector<value> items;
  items.reserve(bytes->items.size());
  for (const auto item : bytes->items) {
    items.push_back(static_cast<double>(item));
  }
  return make_array(std::move(items));
}

value bytes_to_utf8(const value& input) {
  const auto bytes = require_bytes_value(input, "Jayess bytes toUtf8 expects a bytes input");
  return std::string(bytes->items.begin(), bytes->items.end());
}

value bytes_length(const value& input) {
  const auto bytes = require_bytes_value(input, "Jayess bytes length expects a bytes input");
  return static_cast<double>(bytes->items.size());
}

value bytes_get(const value& input, const value& index) {
  const auto bytes = require_bytes_value(input, "Jayess bytes get expects a bytes input");
  return static_cast<double>(bytes->items[require_byte_index(index, bytes->items.size(), "Jayess bytes get index is out of range")]);
}

value bytes_set(const value& input, const value& index, const value& assigned) {
  const auto bytes = require_bytes_value(input, "Jayess bytes set expects a bytes input");
  bytes->items[require_byte_index(index, bytes->items.size(), "Jayess bytes set index is out of range")] =
    require_byte_number(assigned, "Jayess bytes set expects a byte value");
  return input;
}

value bytes_fill(const value& input, const value& assigned) {
  const auto bytes = require_bytes_value(input, "Jayess bytes fill expects a bytes input");
  std::fill(bytes->items.begin(), bytes->items.end(), require_byte_number(assigned, "Jayess bytes fill expects a byte value"));
  return input;
}

value bytes_slice(const value& input, const std::vector<value>& args) {
  const auto bytes = require_bytes_value(input, "Jayess bytes slice expects a bytes input");
  const auto start = clamp_bytes_index(require_bytes_number_argument(args, 0, "Jayess bytes slice expects a numeric start index"), bytes->items.size());
  const auto end = args.size() > 1
    ? clamp_bytes_index(require_bytes_number_argument(args, 1, "Jayess bytes slice expects a numeric end index"), bytes->items.size())
    : bytes->items.size();

  if (end <= start) {
    return make_bytes({});
  }

  return make_bytes(std::vector<unsigned char>(bytes->items.begin() + start, bytes->items.begin() + end));
}

value bytes_concat(const value& left, const value& right) {
  const auto leftBytes = require_bytes_value(left, "Jayess bytes concat expects a bytes left input");
  const auto rightBytes = require_bytes_value(right, "Jayess bytes concat expects a bytes right input");
  std::vector<unsigned char> items;
  items.reserve(leftBytes->items.size() + rightBytes->items.size());
  items.insert(items.end(), leftBytes->items.begin(), leftBytes->items.end());
  items.insert(items.end(), rightBytes->items.begin(), rightBytes->items.end());
  return make_bytes(std::move(items));
}

value bytes_equals(const value& left, const value& right) {
  const auto leftBytes = require_bytes_value(left, "Jayess bytes equals expects a bytes left input");
  const auto rightBytes = require_bytes_value(right, "Jayess bytes equals expects a bytes right input");
  return leftBytes->items == rightBytes->items;
}

value bytes_secure_equals(const value& left, const value& right) {
  const auto leftBytes = require_bytes_value(left, "Jayess bytes secureEquals expects a bytes left input");
  const auto rightBytes = require_bytes_value(right, "Jayess bytes secureEquals expects a bytes right input");

  const auto leftSize = leftBytes->items.size();
  const auto rightSize = rightBytes->items.size();
  const auto sharedSize = (std::min)(leftSize, rightSize);

  unsigned int diff = static_cast<unsigned int>(leftSize ^ rightSize);
  for (std::size_t index = 0; index < sharedSize; index += 1) {
    diff |= static_cast<unsigned int>(leftBytes->items[index] ^ rightBytes->items[index]);
  }
  return diff == 0U;
}

value bytes_compare(const value& left, const value& right) {
  const auto leftBytes = require_bytes_value(left, "Jayess bytes compare expects a bytes left input");
  const auto rightBytes = require_bytes_value(right, "Jayess bytes compare expects a bytes right input");
  if (leftBytes->items == rightBytes->items) {
    return 0.0;
  }
  return std::lexicographical_compare(leftBytes->items.begin(), leftBytes->items.end(), rightBytes->items.begin(), rightBytes->items.end())
    ? -1.0
    : 1.0;
}

value bytes_starts_with(const value& input, const value& prefix) {
  const auto bytes = require_bytes_value(input, "Jayess bytes startsWith expects a bytes input");
  const auto prefixBytes = require_bytes_value(prefix, "Jayess bytes startsWith expects a bytes prefix");
  return bytes->items.size() >= prefixBytes->items.size()
    && std::equal(prefixBytes->items.begin(), prefixBytes->items.end(), bytes->items.begin());
}

value bytes_ends_with(const value& input, const value& suffix) {
  const auto bytes = require_bytes_value(input, "Jayess bytes endsWith expects a bytes input");
  const auto suffixBytes = require_bytes_value(suffix, "Jayess bytes endsWith expects a bytes suffix");
  return bytes->items.size() >= suffixBytes->items.size()
    && std::equal(suffixBytes->items.rbegin(), suffixBytes->items.rend(), bytes->items.rbegin());
}

bool is_bytes_value(const value& input) {
  return std::holds_alternative<bytes_ptr>(input);
}`;
}
