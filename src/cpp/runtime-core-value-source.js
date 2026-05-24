export function getCoreValueTruthRuntimeHeaderFragment() {
  return `bool truthy(const value& input);
bool is_null(const value& input);`;
}

export function getCoreValueTruthRuntimeCppFragment() {
  return `bool truthy(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return false;
  }
  if (std::holds_alternative<bool>(input)) {
    return std::get<bool>(input);
  }
  if (std::holds_alternative<double>(input)) {
    return std::get<double>(input) != 0.0;
  }
  if (std::holds_alternative<array_ptr>(input)) {
    return !std::get<array_ptr>(input)->items.empty();
  }
  if (std::holds_alternative<object_ptr>(input)) {
    return !std::get<object_ptr>(input)->fields.empty();
  }
  if (std::holds_alternative<callable_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<event_emitter_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<async_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<cancellation_token_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<bytes_ptr>(input)) {
    return !std::get<bytes_ptr>(input)->items.empty();
  }
  if (std::holds_alternative<generator_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<map_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<set_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<stream_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<subprocess_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<thread_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<channel_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<net_socket_ptr>(input) || std::holds_alternative<net_server_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<http_server_ptr>(input) || std::holds_alternative<http_response_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<image_ptr>(input)) {
    return true;
  }
  return !std::get<std::string>(input).empty();
}

bool is_null(const value& input) {
  return std::holds_alternative<std::monostate>(input);
}`;
}

export function getCoreValueStringRuntimeHeaderFragment() {
  return `std::string stringify_value(const value& input);
value interpolate(std::vector<value> parts);
value to_string_value(const value& input);`;
}

export function getCoreValueStringRuntimeCppFragment() {
  return `std::string stringify_value(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return "null";
  }
  if (std::holds_alternative<double>(input)) {
    std::ostringstream stream;
    stream << std::get<double>(input);
    return stream.str();
  }
  if (std::holds_alternative<bool>(input)) {
    return std::get<bool>(input) ? "true" : "false";
  }
  if (std::holds_alternative<std::string>(input)) {
    return std::get<std::string>(input);
  }
  if (std::holds_alternative<thread_ptr>(input)) {
    throw_unsupported_string_conversion("thread handles");
  }
  if (std::holds_alternative<cancellation_token_ptr>(input)) {
    throw_unsupported_string_conversion("cancellation token handles");
  }
  if (std::holds_alternative<channel_ptr>(input)) {
    throw_unsupported_string_conversion("channel handles");
  }
  if (std::holds_alternative<subprocess_ptr>(input)) {
    throw_unsupported_string_conversion("subprocess handles");
  }
  if (std::holds_alternative<event_emitter_ptr>(input)) {
    throw_unsupported_string_conversion("event emitter handles");
  }
  if (std::holds_alternative<stream_ptr>(input)) {
    throw_unsupported_string_conversion("stream handles");
  }
  if (std::holds_alternative<bytes_ptr>(input)) {
    throw_unsupported_string_conversion("bytes values");
  }
  if (std::holds_alternative<net_socket_ptr>(input) || std::holds_alternative<net_server_ptr>(input)) {
    throw_unsupported_string_conversion("net handles");
  }
  if (std::holds_alternative<http_server_ptr>(input) || std::holds_alternative<http_response_ptr>(input)) {
    throw_unsupported_string_conversion("http handles");
  }
  if (std::holds_alternative<image_ptr>(input)) {
    throw_unsupported_string_conversion("image handles");
  }
  throw_unsupported_interpolation_value();
}

std::string property_key_string(const value& input) {
  return stringify_value(input);
}

value interpolate(std::vector<value> parts) {
  std::string result;
  for (const auto& part : parts) {
    result += stringify_value(part);
  }
  return result;
}

value to_string_value(const value& input) {
  return stringify_value(input);
}`;
}

export function getCoreValueEqualityRuntimeHeaderFragment() {
  return `value equal(const value& left, const value& right);
value not_equal(const value& left, const value& right);`;
}

export function getCoreValueEqualityRuntimeCppFragment() {
  return `value equal(const value& left, const value& right) {
  if (left.index() != right.index()) {
    return false;
  }
  if (std::holds_alternative<std::monostate>(left)) {
    return true;
  }
  if (std::holds_alternative<double>(left)) {
    return std::get<double>(left) == std::get<double>(right);
  }
  if (std::holds_alternative<bool>(left)) {
    return std::get<bool>(left) == std::get<bool>(right);
  }
  if (std::holds_alternative<array_ptr>(left)) {
    return std::get<array_ptr>(left) == std::get<array_ptr>(right);
  }
  if (std::holds_alternative<object_ptr>(left)) {
    return std::get<object_ptr>(left) == std::get<object_ptr>(right);
  }
  if (std::holds_alternative<callable_ptr>(left)) {
    return std::get<callable_ptr>(left) == std::get<callable_ptr>(right);
  }
  if (std::holds_alternative<event_emitter_ptr>(left)) {
    return std::get<event_emitter_ptr>(left) == std::get<event_emitter_ptr>(right);
  }
  if (std::holds_alternative<async_ptr>(left)) {
    return std::get<async_ptr>(left) == std::get<async_ptr>(right);
  }
  if (std::holds_alternative<cancellation_token_ptr>(left)) {
    return std::get<cancellation_token_ptr>(left) == std::get<cancellation_token_ptr>(right);
  }
  if (std::holds_alternative<bytes_ptr>(left)) {
    return std::get<bytes_ptr>(left) == std::get<bytes_ptr>(right);
  }
  if (std::holds_alternative<generator_ptr>(left)) {
    return std::get<generator_ptr>(left) == std::get<generator_ptr>(right);
  }
  if (std::holds_alternative<map_ptr>(left)) {
    return std::get<map_ptr>(left) == std::get<map_ptr>(right);
  }
  if (std::holds_alternative<set_ptr>(left)) {
    return std::get<set_ptr>(left) == std::get<set_ptr>(right);
  }
  if (std::holds_alternative<stream_ptr>(left)) {
    return std::get<stream_ptr>(left) == std::get<stream_ptr>(right);
  }
  if (std::holds_alternative<subprocess_ptr>(left)) {
    return std::get<subprocess_ptr>(left) == std::get<subprocess_ptr>(right);
  }
  if (std::holds_alternative<thread_ptr>(left)) {
    return std::get<thread_ptr>(left) == std::get<thread_ptr>(right);
  }
  if (std::holds_alternative<channel_ptr>(left)) {
    return std::get<channel_ptr>(left) == std::get<channel_ptr>(right);
  }
  if (std::holds_alternative<net_socket_ptr>(left)) {
    return std::get<net_socket_ptr>(left) == std::get<net_socket_ptr>(right);
  }
  if (std::holds_alternative<net_server_ptr>(left)) {
    return std::get<net_server_ptr>(left) == std::get<net_server_ptr>(right);
  }
  if (std::holds_alternative<http_server_ptr>(left)) {
    return std::get<http_server_ptr>(left) == std::get<http_server_ptr>(right);
  }
  if (std::holds_alternative<http_response_ptr>(left)) {
    return std::get<http_response_ptr>(left) == std::get<http_response_ptr>(right);
  }
  if (std::holds_alternative<image_ptr>(left)) {
    return std::get<image_ptr>(left) == std::get<image_ptr>(right);
  }
  return std::get<std::string>(left) == std::get<std::string>(right);
}

value not_equal(const value& left, const value& right) {
  return !std::get<bool>(equal(left, right));
}`;
}
