export function getArrayRuntimeHeaderFragment() {
  return `value array_slice(const value& input, const std::vector<value>& args);
value array_concat(const value& left, const value& right);
value array_index_of(const value& input, const value& needle);
value array_map(const value& input, const value& callback);
value array_filter(const value& input, const value& callback);
value array_reduce(const value& input, const value& callback, const value& initial);`;
}

export function getArrayRuntimeCppFragment() {
  return `namespace {
array_ptr require_array_value(const value& input, const std::string& message) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<array_ptr>(input);
}

double require_array_number_argument(const std::vector<value>& args, std::size_t index, const std::string& message) {
  if (index >= args.size() || !std::holds_alternative<double>(args[index])) {
    throw std::runtime_error(message);
  }
  return std::get<double>(args[index]);
}

std::size_t clamp_array_index(double raw, std::size_t size) {
  if (raw <= 0.0) {
    return 0;
  }
  const auto index = static_cast<std::size_t>(raw);
  if (index > size) {
    return size;
  }
  return index;
}

callable_ptr require_array_callback(const value& callback, const std::string& message) {
  if (!std::holds_alternative<callable_ptr>(callback)) {
    throw std::runtime_error(message);
  }
  return std::get<callable_ptr>(callback);
}
} // namespace

value array_slice(const value& input, const std::vector<value>& args) {
  const auto array = require_array_value(input, "Jayess array slice expects an array input");
  const auto start = clamp_array_index(require_array_number_argument(args, 0, "Jayess array slice expects a numeric start index"), array->items.size());
  const auto end = args.size() > 1
    ? clamp_array_index(require_array_number_argument(args, 1, "Jayess array slice expects a numeric end index"), array->items.size())
    : array->items.size();

  if (end <= start) {
    return make_array({});
  }

  std::vector<value> items;
  items.reserve(end - start);
  for (std::size_t index = start; index < end; index += 1) {
    items.push_back(array->items[index]);
  }
  return make_array(std::move(items));
}

value array_concat(const value& left, const value& right) {
  const auto leftArray = require_array_value(left, "Jayess array concat expects an array input");
  const auto rightArray = require_array_value(right, "Jayess array concat expects an array argument");
  std::vector<value> items;
  items.reserve(leftArray->items.size() + rightArray->items.size());
  items.insert(items.end(), leftArray->items.begin(), leftArray->items.end());
  items.insert(items.end(), rightArray->items.begin(), rightArray->items.end());
  return make_array(std::move(items));
}

value array_index_of(const value& input, const value& needle) {
  const auto array = require_array_value(input, "Jayess array indexOf expects an array input");
  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    if (std::get<bool>(equal(array->items[index], needle))) {
      return static_cast<double>(index);
    }
  }
  return static_cast<double>(-1);
}

value array_map(const value& input, const value& callback) {
  const auto array = require_array_value(input, "Jayess array map expects an array input");
  const auto callable = require_array_callback(callback, "Jayess array map expects a callable callback");
  std::vector<value> mapped;
  mapped.reserve(array->items.size());
  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    mapped.push_back(callable->fn({array->items[index], static_cast<double>(index), input}));
  }
  return make_array(std::move(mapped));
}

value array_filter(const value& input, const value& callback) {
  const auto array = require_array_value(input, "Jayess array filter expects an array input");
  const auto callable = require_array_callback(callback, "Jayess array filter expects a callable callback");
  std::vector<value> filtered;
  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto keep = callable->fn({array->items[index], static_cast<double>(index), input});
    if (truthy(keep)) {
      filtered.push_back(array->items[index]);
    }
  }
  return make_array(std::move(filtered));
}

value array_reduce(const value& input, const value& callback, const value& initial) {
  const auto array = require_array_value(input, "Jayess array reduce expects an array input");
  const auto callable = require_array_callback(callback, "Jayess array reduce expects a callable callback");
  value accumulator = initial;
  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    accumulator = callable->fn({accumulator, array->items[index], static_cast<double>(index), input});
  }
  return accumulator;
}`;
}
