export function getIterRuntimeHeaderFragment() {
  return `value iter_next(const value& generator, const value& sent = value(std::monostate{}));
value iter_to_array(const value& generator);
value iter_take(const value& generator, const value& count);
value iter_map(const value& generator, const value& callback);
value iter_filter(const value& generator, const value& callback);`;
}

export function getIterRuntimeCppFragment() {
  return `namespace {
const generator_ptr& require_iter_generator(const value& input) {
  if (!std::holds_alternative<generator_ptr>(input)) {
    throw std::runtime_error("Jayess iterator helpers expect a generator handle");
  }
  return std::get<generator_ptr>(input);
}

const callable_ptr& require_iter_callback(const value& input) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error("Jayess iterator callback helpers expect a callable callback");
  }
  return std::get<callable_ptr>(input);
}

std::size_t require_iter_count(const value& input) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error("Jayess iterator take expects a non-negative integer count");
  }
  const auto count = std::get<double>(input);
  if (!std::isfinite(count) || count < 0.0 || std::floor(count) != count) {
    throw std::runtime_error("Jayess iterator take expects a non-negative integer count");
  }
  return static_cast<std::size_t>(count);
}
} // namespace

value iter_next(const value& generator, const value& sent) {
  require_iter_generator(generator);
  if (generator_is_completed(generator)) {
    return value(std::monostate{});
  }
  const auto current = generator_resume_with(generator, sent);
  if (generator_is_completed(generator)) {
    return value(std::monostate{});
  }
  return current;
}

value iter_to_array(const value& generator) {
  require_iter_generator(generator);
  std::vector<value> items;
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator)) {
      items.push_back(current);
    }
  }
  return make_array(std::move(items));
}

value iter_take(const value& generator, const value& count) {
  require_iter_generator(generator);
  const auto limit = require_iter_count(count);
  std::vector<value> items;
  items.reserve(limit);
  while (items.size() < limit && !generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator)) {
      items.push_back(current);
    }
  }
  return make_array(std::move(items));
}

value iter_map(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  std::vector<value> items;
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator)) {
      items.push_back(callable->fn({current}));
    }
  }
  return make_array(std::move(items));
}

value iter_filter(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  std::vector<value> items;
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator) && truthy(callable->fn({current}))) {
      items.push_back(current);
    }
  }
  return make_array(std::move(items));
}`;
}
