export function getIterRuntimeHeaderFragment() {
  return `value iter_next(const value& generator, const value& sent = value(std::monostate{}));
value iter_to_array(const value& generator);
value iter_take(const value& generator, const value& count);
value iter_map(const value& generator, const value& callback);
value iter_filter(const value& generator, const value& callback);
value iter_for_each(const value& generator, const value& callback);
value iter_reduce(const value& generator, const value& callback, const value& initial);
value iter_some(const value& generator, const value& callback);
value iter_every(const value& generator, const value& callback);
value iter_find(const value& generator, const value& callback);
value iter_chain(const value& left, const value& right);
value iter_range(const value& start, const value& end, const value& step);`;
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

double require_iter_number(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto number = std::get<double>(input);
  if (!std::isfinite(number)) {
    throw std::runtime_error(message);
  }
  return number;
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
}

value iter_for_each(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator)) {
      callable->fn({current});
    }
  }
  return value(std::monostate{});
}

value iter_reduce(const value& generator, const value& callback, const value& initial) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  value accumulator = initial;
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator)) {
      accumulator = callable->fn({accumulator, current});
    }
  }
  return accumulator;
}

value iter_some(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator) && truthy(callable->fn({current}))) {
      return true;
    }
  }
  return false;
}

value iter_every(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator) && !truthy(callable->fn({current}))) {
      return false;
    }
  }
  return true;
}

value iter_find(const value& generator, const value& callback) {
  require_iter_generator(generator);
  const auto& callable = require_iter_callback(callback);
  while (!generator_is_completed(generator)) {
    const auto current = generator_resume(generator);
    if (!generator_is_completed(generator) && truthy(callable->fn({current}))) {
      return current;
    }
  }
  return value(std::monostate{});
}

value iter_chain(const value& left, const value& right) {
  require_iter_generator(left);
  require_iter_generator(right);
  const auto chained = make_generator_handle();
  generator_set_resume(chained, [chained, left, right, phase = 0]() mutable {
    while (phase < 2) {
      const auto current = phase == 0 ? generator_resume(left) : generator_resume(right);
      const auto completed = phase == 0 ? generator_is_completed(left) : generator_is_completed(right);
      if (!completed) {
        generator_yield(chained, 0, current);
        return;
      }
      phase += 1;
    }
    generator_complete(chained, value(std::monostate{}));
  });
  return chained;
}

value iter_range(const value& start, const value& end, const value& step) {
  const auto startNumber = require_iter_number(start, "Jayess iterator range expects a numeric start");
  const auto endNumber = require_iter_number(end, "Jayess iterator range expects a numeric end");
  const auto stepNumber = require_iter_number(step, "Jayess iterator range expects a non-zero numeric step");
  if (stepNumber == 0.0) {
    throw std::runtime_error("Jayess iterator range expects a non-zero numeric step");
  }

  const auto ranged = make_generator_handle();
  generator_set_resume(ranged, [ranged, current = startNumber, endNumber, stepNumber]() mutable {
    const auto done = stepNumber > 0.0 ? current >= endNumber : current <= endNumber;
    if (done) {
      generator_complete(ranged, value(std::monostate{}));
      return;
    }

    const auto yielded = current;
    current += stepNumber;
    generator_yield(ranged, 0, yielded);
  });
  return ranged;
}`;
}
